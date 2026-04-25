// Utility to convert basic markdown to HTML
export const parseMarkdown = (text) => {
    let html = text;
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Code blocks
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Bullet points (simple)
    html = html.replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>');
    html = html.replace(/<\/ul>\n<ul>/g, ''); // merge lists
    
    // Newlines to br
    html = html.replace(/\n/g, '<br>');
    
    return html;
};

// UI transitions
export const showSection = (sectionId) => {
    // Hide all sections
    document.querySelectorAll('.glass-panel').forEach(panel => {
        panel.classList.remove('active');
        setTimeout(() => {
            if(!panel.classList.contains('active')) {
                panel.classList.add('hidden');
            }
        }, 500); // Wait for transition
    });

    // Show target section
    const target = document.getElementById(sectionId);
    target.classList.remove('hidden');
    // small delay to allow display:block to apply before animating opacity
    setTimeout(() => {
        target.classList.add('active');
    }, 50);
};

// Chat UI
export const appendMessage = (containerId, text, role) => {
    const container = document.getElementById(containerId);
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    
    if (role === 'bot') {
        msgDiv.innerHTML = parseMarkdown(text);
    } else {
        msgDiv.textContent = text; // Don't parse markdown for user input
    }
    
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
};

export const showTypingIndicator = (containerId) => {
    const container = document.getElementById(containerId);
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
};

export const removeTypingIndicator = () => {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
};
