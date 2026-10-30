document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('edit-profile-form');
    const nameInput = document.getElementById('profile-name');
    const photoInput = document.getElementById('profile-photo');
    const avatar = document.getElementById('edit-profile-avatar');
    const saveButton = document.getElementById('save-profile-btn');
    const defaultAvatar = 'https://via.placeholder.com/120/cccccc/666666?text=User';

    photoInput.addEventListener('input', () => {
        const photoUrl = photoInput.value.trim();
        if (photoUrl && photoInput.validity.valid) {
            avatar.src = photoUrl;
        } else if (!photoUrl) {
            avatar.src = window.currentUser?.photo || defaultAvatar;
        }
    });

    avatar.addEventListener('error', () => {
        avatar.src = defaultAvatar;
    });

    waitForUser((user) => {
        if (!user) {
            window.appPopup.alert('Please sign in to edit your profile.', { type: 'info' });
            window.location.replace('profile.html');
            return;
        }

        nameInput.value = user.name || '';
        photoInput.value = user.photo || '';
        avatar.src = user.photo || defaultAvatar;
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const user = window.currentUser;
        if (!user?.email) {
            window.appPopup.alert('Please sign in to edit your profile.', { type: 'error' });
            return;
        }

        const name = nameInput.value.trim();
        const photo = photoInput.value.trim();
        if (!name) {
            nameInput.focus();
            window.appPopup.alert('Please enter a display name.', { type: 'warning' });
            return;
        }
        if (photo) {
            try {
                const parsedPhotoUrl = new URL(photo);
                if (!['http:', 'https:'].includes(parsedPhotoUrl.protocol)) {
                    throw new Error('Unsupported URL protocol');
                }
            } catch {
                photoInput.focus();
                window.appPopup.alert('Enter a valid image URL starting with http:// or https://.', { type: 'warning' });
                return;
            }
        }

        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
        try {
            const db = firebase.firestore();
            const batch = db.batch();
            batch.set(db.collection('users').doc(user.email), {
                name,
                ...(photo ? { photo } : {})
            }, { merge: true });
            batch.set(db.collection('publicProfiles').doc(user.email), {
                name,
                email: user.email,
                ...(photo ? { photo } : {})
            }, { merge: true });
            await batch.commit();

            if (typeof window.updateCurrentUserProfile === 'function') {
                window.updateCurrentUserProfile({ name, ...(photo ? { photo } : {}) });
            } else {
                window.currentUser.name = name;
                if (photo) window.currentUser.photo = photo;
            }

            window.location.href = 'profile.html';
        } catch (error) {
            console.error('Error saving profile:', error);
            window.appPopup.alert(`Could not save your profile: ${error.message}`, { type: 'error' });
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Save changes';
        }
    });
});

function waitForUser(callback) {
    let attempts = 0;
    const wait = setInterval(() => {
        attempts += 1;
        if (window.currentUser !== undefined || attempts >= 100) {
            clearInterval(wait);
            callback(window.currentUser || null);
        }
    }, 100);
}
