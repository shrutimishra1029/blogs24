// article.js - Individual Article Page
let currentArticleId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Get blog ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    currentArticleId = urlParams.get('id');
    
    if (!currentArticleId) {
        showError();
        return;
    }
    
    // Load the article
    loadArticle(currentArticleId);
});

function loadArticle(articleId) {
    firebase.firestore().collection('news').doc(articleId).get()
        .then((doc) => {
            if (!doc.exists) {
                showError();
                return;
            }
            
            const article = doc.data();
            displayArticle(article);
            loadComments(articleId);
            
            // Hide loading, show content
            document.getElementById('article-loading').style.display = 'none';
            document.getElementById('article-content').style.display = 'block';
        })
        .catch((error) => {
            console.error('Error loading blog:', error);
            showError();
        });
}

function displayArticle(article) {
    // Set title
    document.getElementById('article-title').textContent = article.title;
    document.title = `${article.title} - Blogs24`;
    
    // Set category badge
    const categoryBadge = document.getElementById('article-category-badge');
    categoryBadge.textContent = article.category.toUpperCase();
    categoryBadge.className = `article-category-badge category-${article.category}`;
    
    // Set meta info
    document.getElementById('article-author').textContent = `By ${article.author}`;
    const date = article.createdAt ? new Date(article.createdAt.seconds * 1000).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    }) : 'Just now';
    document.getElementById('article-date').textContent = date;
    
    // Set image
    document.getElementById('article-image').src = article.imageUrl;
    document.getElementById('article-image').alt = article.title;
    
    // Set body
    document.getElementById('article-body').innerHTML = `<p>${article.description}</p>`;
    
    // Update like/bookmark buttons if user is logged in
    if (window.currentUser) {
        const isLiked = article.likes?.includes(window.currentUser.email);
        const isBookmarked = article.bookmarks?.includes(window.currentUser.email);
        
        updateLikeButton(isLiked, article.likes?.length || 0);
        updateBookmarkButton(isBookmarked);
    } else {
        document.getElementById('like-count').textContent = article.likes?.length || 0;
    }
    
    // Update comments count
    document.getElementById('comments-count').textContent = article.comments?.length || 0;
}

function updateLikeButton(isLiked, count) {
    const likeBtn = document.getElementById('like-btn');
    const likeText = document.getElementById('like-text');
    const likeCount = document.getElementById('like-count');
    
    if (isLiked) {
        likeBtn.classList.add('active');
        likeText.textContent = 'Liked';
    } else {
        likeBtn.classList.remove('active');
        likeText.textContent = 'Like';
    }
    likeCount.textContent = count;
}

function updateBookmarkButton(isBookmarked) {
    const bookmarkBtn = document.getElementById('bookmark-btn');
    const bookmarkText = document.getElementById('bookmark-text');
    
    if (isBookmarked) {
        bookmarkBtn.classList.add('active');
        bookmarkText.textContent = 'Bookmarked';
    } else {
        bookmarkBtn.classList.remove('active');
        bookmarkText.textContent = 'Bookmark';
    }
}

function toggleLikeArticle() {
    if (!window.currentUser) {
        alert('Please login to like blogs');
        return;
    }
    
    const newsRef = firebase.firestore().collection('news').doc(currentArticleId);
    const userEmail = window.currentUser.email;
    
    newsRef.get().then((doc) => {
        const likes = doc.data().likes || [];
        const isLiked = likes.includes(userEmail);
        
        if (isLiked) {
            newsRef.update({ likes: firebase.firestore.FieldValue.arrayRemove(userEmail) });
            updateLikeButton(false, likes.length - 1);
        } else {
            newsRef.update({ likes: firebase.firestore.FieldValue.arrayUnion(userEmail) });
            updateLikeButton(true, likes.length + 1);
        }
    });
}

function toggleBookmarkArticle() {
    if (!window.currentUser) {
        alert('Please login to bookmark blogs');
        return;
    }
    
    const newsRef = firebase.firestore().collection('news').doc(currentArticleId);
    const userEmail = window.currentUser.email;
    
    newsRef.get().then((doc) => {
        const bookmarks = doc.data().bookmarks || [];
        const isBookmarked = bookmarks.includes(userEmail);
        
        if (isBookmarked) {
            newsRef.update({ bookmarks: firebase.firestore.FieldValue.arrayRemove(userEmail) });
            updateBookmarkButton(false);
            alert('Bookmark removed');
        } else {
            newsRef.update({ bookmarks: firebase.firestore.FieldValue.arrayUnion(userEmail) });
            updateBookmarkButton(true);
            alert('Blog bookmarked!');
        }
    });
}

function shareArticle() {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: document.getElementById('article-title').textContent,
            url: url
        });
    } else {
        navigator.clipboard.writeText(url);
        alert('Blog link copied to clipboard!');
    }
}

function loadComments(articleId) {
    firebase.firestore().collection('news').doc(articleId).get()
        .then((doc) => {
            const comments = doc.data().comments || [];
            const commentsList = document.getElementById('comments-list');
            
            if (comments.length === 0) {
                commentsList.innerHTML = '<p style="color: #999; text-align: center; padding: 30px;">No comments yet. Be the first to comment!</p>';
                return;
            }
            
            // Sort comments by timestamp (newest first)
comments.sort((a, b) => b.timestamp - a.timestamp);

commentsList.replaceChildren();
comments.forEach((comment) => {
    const item = document.createElement('div');
    const header = document.createElement('div');
    const author = document.createElement('span');
    const profileLink = document.createElement('a');
    const date = document.createElement('span');
    const text = document.createElement('div');

    item.className = 'comment-item-full';
    header.className = 'comment-header-full';
    author.className = 'comment-author-full';
    profileLink.href = `public-profile.html?email=${encodeURIComponent(comment.email || '')}`;
    profileLink.style.color = '#c41e3a';
    profileLink.style.textDecoration = 'none';
    profileLink.style.fontWeight = '600';
    profileLink.textContent = comment.author || 'Anonymous';
    date.className = 'comment-date-full';
    date.textContent = new Date(comment.timestamp).toLocaleDateString();
    text.className = 'comment-text-full';
    text.textContent = comment.text || '';

    author.appendChild(profileLink);
    header.append(author, date);
    item.append(header, text);
    commentsList.appendChild(item);
});
        });
}

function postComment() {
    if (!window.currentUser) {
        alert('Please login to comment');
        return;
    }
    
    const commentInput = document.getElementById('comment-input');
    const commentText = commentInput.value.trim();
    
    if (!commentText) {
        alert('Please write a comment');
        return;
    }
    
    const newsRef = firebase.firestore().collection('news').doc(currentArticleId);
    
    newsRef.update({
        comments: firebase.firestore.FieldValue.arrayUnion({
            author: window.currentUser.name,
            email: window.currentUser.email,
            text: commentText,
            timestamp: Date.now()
        })
    })
    .then(() => {
        commentInput.value = '';
        loadComments(currentArticleId);
        
        // Update comment count
        const currentCount = parseInt(document.getElementById('comments-count').textContent);
        document.getElementById('comments-count').textContent = currentCount + 1;
        
        alert('Comment posted!');
    })
    .catch((error) => {
        alert('Error posting comment: ' + error.message);
    });
}

function showError() {
    document.getElementById('article-loading').style.display = 'none';
    document.getElementById('article-error').style.display = 'block';
}

function waitForUser(callback) {
    if (window.currentUser !== undefined) {
        // User data is loaded (could be null or object)
        callback();
    } else {
        // Wait and check again
        setTimeout(() => waitForUser(callback), 100);
    }
}