(function () {
    const icons = {
        success: '✓',
        error: '!',
        warning: '!',
        info: 'i'
    };

    function getMessageType(message) {
        const text = String(message).toLowerCase();
        if (/[❌]|error|failed|denied|cannot/.test(text)) return 'error';
        if (/[⚠️]|warning|delete|permanently/.test(text)) return 'warning';
        if (/[✅]|success|posted|removed|bookmarked|copied|saved/.test(text)) return 'success';
        return 'info';
    }

    function toast(message, type) {
        let container = document.querySelector('.app-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'app-toast-container';
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }
        const kind = type || getMessageType(message);
        const item = document.createElement('div');
        const icon = document.createElement('span');
        const text = document.createElement('span');
        item.className = `app-toast app-toast-${kind}`;
        item.setAttribute('role', 'status');
        icon.className = 'app-toast-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = icons[kind] || icons.info;
        text.className = 'app-toast-message';
        text.textContent = String(message).replace(/^[✅❌⚠️ℹ️]+\s*/, '');
        item.append(icon, text);
        container.appendChild(item);
        requestAnimationFrame(() => item.classList.add('is-visible'));

        const dismiss = () => {
            item.classList.remove('is-visible');
            item.addEventListener('transitionend', () => item.remove(), { once: true });
            setTimeout(() => item.remove(), 300);
        };
        const timeout = setTimeout(dismiss, 4200);
        item.addEventListener('click', () => {
            clearTimeout(timeout);
            dismiss();
        });
    }

    function dialog({ title, message, kind = 'info', input, confirmLabel, cancelLabel }) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            const panel = document.createElement('section');
            const icon = document.createElement('span');
            const heading = document.createElement('h2');
            const description = document.createElement('p');
            const actions = document.createElement('div');
            const cancel = document.createElement('button');
            const confirm = document.createElement('button');
            let inputElement;
            let settled = false;

            overlay.className = 'app-dialog-backdrop';
            panel.className = `app-dialog app-dialog-${kind}`;
            panel.setAttribute('role', 'dialog');
            panel.setAttribute('aria-modal', 'true');
            panel.setAttribute('aria-labelledby', 'app-dialog-title');
            panel.setAttribute('aria-describedby', 'app-dialog-message');
            icon.className = 'app-dialog-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = icons[kind] || icons.info;
            heading.className = 'app-dialog-title';
            heading.id = 'app-dialog-title';
            heading.textContent = title;
            description.className = 'app-dialog-message';
            description.id = 'app-dialog-message';
            description.textContent = String(message);
            actions.className = 'app-dialog-actions';
            cancel.className = 'app-dialog-button app-dialog-cancel';
            cancel.type = 'button';
            cancel.textContent = cancelLabel || 'Cancel';
            confirm.className = `app-dialog-button app-dialog-confirm app-dialog-confirm-${kind}`;
            confirm.type = 'button';
            confirm.textContent = confirmLabel || 'Continue';

            if (input) {
                inputElement = document.createElement('input');
                inputElement.className = 'app-dialog-input';
                inputElement.type = 'text';
                inputElement.value = input.defaultValue || '';
                inputElement.placeholder = input.placeholder || '';
                inputElement.setAttribute('aria-label', input.label || 'Your response');
            }

            function close(value) {
                if (settled) return;
                settled = true;
                document.removeEventListener('keydown', onKeyDown);
                overlay.classList.remove('is-visible');
                overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
                setTimeout(() => overlay.remove(), 250);
                resolve(value);
            }

            function onKeyDown(event) {
                if (event.key === 'Escape') close(input ? null : false);
                if (event.key === 'Enter' && inputElement && document.activeElement === inputElement) {
                    event.preventDefault();
                    close(inputElement.value);
                }
                if (event.key === 'Tab') {
                    const focusable = [cancel, confirm].filter((button) => !button.hidden);
                    if (inputElement) focusable.splice(1, 0, inputElement);
                    const current = focusable.indexOf(document.activeElement);
                    const next = event.shiftKey
                        ? (current <= 0 ? focusable.length - 1 : current - 1)
                        : (current === focusable.length - 1 ? 0 : current + 1);
                    event.preventDefault();
                    focusable[next].focus();
                }
            }

            cancel.addEventListener('click', () => close(input ? null : false));
            confirm.addEventListener('click', () => close(inputElement ? inputElement.value : true));
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) close(input ? null : false);
            });
            actions.append(cancel, confirm);
            panel.append(icon, heading, description);
            if (inputElement) panel.appendChild(inputElement);
            panel.appendChild(actions);
            overlay.appendChild(panel);
            document.body.appendChild(overlay);
            document.addEventListener('keydown', onKeyDown);
            requestAnimationFrame(() => {
                overlay.classList.add('is-visible');
                (inputElement || cancel).focus();
            });
        });
    }

    const popup = {
        toast,
        alert(message, options = {}) {
            toast(message, options.type);
        },
        confirm(message, options = {}) {
            return dialog({
                title: options.title || (options.type === 'warning' ? 'Please confirm' : 'Are you sure?'),
                message,
                kind: options.type || getMessageType(message),
                confirmLabel: options.confirmLabel || 'Confirm',
                cancelLabel: options.cancelLabel || 'Cancel'
            });
        },
        prompt(message, options = {}) {
            return dialog({
                title: options.title || 'Enter a value',
                message,
                kind: options.type || 'info',
                confirmLabel: options.confirmLabel || 'Continue',
                cancelLabel: options.cancelLabel || 'Cancel',
                input: {
                    label: options.label,
                    placeholder: options.placeholder,
                    defaultValue: options.defaultValue
                }
            });
        }
    };

    window.appPopup = popup;
    window.alert = (message) => popup.alert(message);
})();
