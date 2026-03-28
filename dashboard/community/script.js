/* ===== VIConnect Community Forum - Script ===== */

const API = '';  // same origin
let currentUser = {
    email: localStorage.getItem('userEmail') || '',
    name:  localStorage.getItem('username')  || '',
    pic:   localStorage.getItem('profilePic') || ''
};

// ===== Init =====
document.addEventListener('DOMContentLoaded', async () => {
    // Theme
    const isDark = localStorage.getItem('darkMode') === 'true';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

    // Set current user info in create-post box
    const picEl  = document.getElementById('currentUserPic');
    const nameEl = document.getElementById('currentUserName');
    nameEl.textContent = currentUser.name || currentUser.email || 'Anonymous';

    // Fetch fresh profile pic
    try {
        const res  = await fetch(`/api/user-profile?email=${encodeURIComponent(currentUser.email)}`);
        const data = await res.json();
        if (data.success && data.profilePic) {
            currentUser.pic = data.profilePic;
            picEl.src = data.profilePic;
        } else {
            picEl.src = generateAvatar(currentUser.name || currentUser.email);
        }
        if (data.username) {
            currentUser.name = data.username;
            nameEl.textContent = data.username;
        }
    } catch (e) {
        picEl.src = generateAvatar(currentUser.name || currentUser.email);
    }

    // Filter
    document.getElementById('categoryFilter').addEventListener('change', () => loadPosts());

    // Load posts
    await loadPosts();
});

// ===== Avatar Generator =====
function generateAvatar(name) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.height = 100;
    const colors = ['#8b5cf6','#ec4899','#3b82f6','#10b981','#f59e0b','#ef4444'];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillRect(0, 0, 100, 100);
    const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    ctx.font = 'bold 40px Inter, Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 50, 50);
    return canvas.toDataURL('image/png');
}

// ===== Load Posts =====
async function loadPosts() {
    const feed = document.getElementById('feed');
    feed.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i><p>Loading posts...</p></div>';

    try {
        const res   = await fetch(`${API}/api/posts`);
        const data  = await res.json();

        if (!data.success || !data.posts.length) {
            feed.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h3>No posts yet</h3>
                    <p>Be the first to start a conversation!</p>
                </div>`;
            return;
        }

        const filter = document.getElementById('categoryFilter').value;
        let posts = data.posts;
        if (filter !== 'all') posts = posts.filter(p => p.category === filter);

        if (!posts.length) {
            feed.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-filter"></i>
                    <h3>No posts in this category</h3>
                    <p>Try a different category or create a new post!</p>
                </div>`;
            return;
        }

        feed.innerHTML = posts.map(p => renderPost(p)).join('');
    } catch (err) {
        console.error('Load posts error:', err);
        feed.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load posts</h3>
                <p>Please refresh the page and try again.</p>
            </div>`;
    }
}

// ===== Render Post =====
function renderPost(post) {
    const isAuthor = post.authorEmail === currentUser.email;
    const isLiked  = post.likes && post.likes.includes(currentUser.email);
    const likeCount   = post.likes ? post.likes.length : 0;
    const commentCount = post.comments ? post.comments.length : 0;
    const timeAgo = getTimeAgo(post.createdAt);
    const avatar  = post.authorPic || generateAvatar(post.author);

    const commentsHtml = (post.comments || []).map(c => `
        <div class="comment">
            <img class="comment-avatar" src="${c.authorPic || generateAvatar(c.author)}" alt="">
            <div class="comment-body">
                <span class="comment-author">${escapeHtml(c.author)}</span>
                <p class="comment-text">${escapeHtml(c.text)}</p>
                <span class="comment-time">${getTimeAgo(c.createdAt)}</span>
            </div>
        </div>
    `).join('');

    return `
    <div class="post-card" data-id="${post._id}">
        <div class="post-header">
            <img class="post-avatar" src="${avatar}" alt="">
            <div class="post-meta">
                <div class="post-author">${escapeHtml(post.author)}</div>
                <div class="post-time">${timeAgo}</div>
            </div>
            <span class="post-category">${escapeHtml(post.category)}</span>
            ${isAuthor ? `<button class="post-delete" onclick="deletePost('${post._id}')" title="Delete"><i class="fas fa-trash-alt"></i></button>` : ''}
        </div>
        <div class="post-content">${escapeHtml(post.content)}</div>
        <div class="post-actions">
            <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post._id}')">
                <i class="fas fa-heart"></i> <span>${likeCount}</span>
            </button>
            <button class="action-btn" onclick="toggleComments('${post._id}')">
                <i class="fas fa-comment"></i> <span>${commentCount}</span>
            </button>
        </div>
        <div class="comments-section" id="comments-${post._id}">
            ${commentsHtml}
            <div class="add-comment">
                <input type="text" id="commentInput-${post._id}" placeholder="Write a comment..." maxlength="500"
                       onkeypress="if(event.key==='Enter') addComment('${post._id}')">
                <button class="comment-send" onclick="addComment('${post._id}')"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    </div>`;
}

// ===== Create Post =====
async function createPost() {
    const content  = document.getElementById('postContent').value.trim();
    const category = document.getElementById('postCategory').value;
    const btn      = document.getElementById('postBtn');

    if (!content) {
        Swal.fire({ icon: 'warning', title: 'Empty Post', text: 'Please write something before posting.', confirmButtonColor: '#8b5cf6' });
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';

    try {
        const res  = await fetch(`${API}/api/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                author: currentUser.name || 'Anonymous',
                authorEmail: currentUser.email,
                authorPic: currentUser.pic,
                content,
                category
            })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        document.getElementById('postContent').value = '';
        await loadPosts();

        Swal.fire({ icon: 'success', title: 'Posted!', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
    } catch (err) {
        console.error('Create post error:', err);
        Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not create post. Try again.', confirmButtonColor: '#8b5cf6' });
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Post';
    }
}

// ===== Like / Unlike =====
async function toggleLike(postId) {
    try {
        const res  = await fetch(`${API}/api/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        // Update UI in place
        const card = document.querySelector(`.post-card[data-id="${postId}"]`);
        if (!card) return;
        const likeBtn = card.querySelector('.action-btn');
        const isLiked = data.likes.includes(currentUser.email);
        likeBtn.className = `action-btn ${isLiked ? 'liked' : ''}`;
        likeBtn.querySelector('span').textContent = data.likes.length;
    } catch (err) {
        console.error('Like error:', err);
    }
}

// ===== Toggle Comments =====
function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    if (section) section.classList.toggle('open');
}

// ===== Add Comment =====
async function addComment(postId) {
    const input = document.getElementById(`commentInput-${postId}`);
    const text  = input.value.trim();
    if (!text) return;

    input.disabled = true;
    try {
        const res  = await fetch(`${API}/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                author: currentUser.name || 'Anonymous',
                authorEmail: currentUser.email,
                authorPic: currentUser.pic,
                text
            })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        input.value = '';
        await loadPosts();
        // Re-open comment section
        const section = document.getElementById(`comments-${postId}`);
        if (section) section.classList.add('open');
    } catch (err) {
        console.error('Comment error:', err);
        Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not add comment.', confirmButtonColor: '#8b5cf6' });
    } finally {
        input.disabled = false;
    }
}

// ===== Delete Post =====
async function deletePost(postId) {
    const result = await Swal.fire({
        title: 'Delete Post?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        confirmButtonColor: '#ef4444',
        cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
        const res = await fetch(`${API}/api/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        await loadPosts();
        Swal.fire({ icon: 'success', title: 'Deleted', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
    } catch (err) {
        console.error('Delete error:', err);
        Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not delete post.', confirmButtonColor: '#8b5cf6' });
    }
}

// ===== Helpers =====
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function getTimeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return 'Just now';
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24)  return `${hours}h ago`;
    if (days < 7)    return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
