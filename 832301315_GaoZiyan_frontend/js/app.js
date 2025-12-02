/**
 * 通讯录管理系统 - 前端逻辑
 * 前后端分离架构
 */

// API配置（从config.js获取）
const API_BASE_URL = window.API_CONFIG.BASE_URL;
const API = {
    list: `${API_BASE_URL}/list.php`,
    get: `${API_BASE_URL}/get.php`,
    add: `${API_BASE_URL}/add.php`,
    update: `${API_BASE_URL}/update.php`,
    delete: `${API_BASE_URL}/delete.php`
};

// 全局状态
let currentEditId = null;
let deleteContactId = null;
let searchTimeout = null;

// DOM元素
const elements = {
    contactsList: document.getElementById('contactsList'),
    contactCount: document.getElementById('contactCount'),
    emptyState: document.getElementById('emptyState'),
    searchInput: document.getElementById('searchInput'),
    addBtn: document.getElementById('addBtn'),
    contactModal: document.getElementById('contactModal'),
    deleteModal: document.getElementById('deleteModal'),
    contactForm: document.getElementById('contactForm'),
    modalTitle: document.getElementById('modalTitle'),
    contactId: document.getElementById('contactId'),
    nameInput: document.getElementById('name'),
    phoneInput: document.getElementById('phone'),
    emailInput: document.getElementById('email'),
    addressInput: document.getElementById('address'),
    notesInput: document.getElementById('notes'),
    closeModal: document.getElementById('closeModal'),
    cancelBtn: document.getElementById('cancelBtn'),
    submitBtn: document.getElementById('submitBtn'),
    closeDeleteModal: document.getElementById('closeDeleteModal'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    deleteContactName: document.getElementById('deleteContactName'),
    loading: document.getElementById('loading'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    loadContacts();
    bindEvents();
});

// ===== 事件绑定 =====
function bindEvents() {
    // 搜索
    elements.searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadContacts(this.value.trim());
        }, 300);
    });
    
    // 新增按钮
    elements.addBtn.addEventListener('click', openAddModal);
    
    // 关闭模态框
    elements.closeModal.addEventListener('click', closeContactModal);
    elements.cancelBtn.addEventListener('click', closeContactModal);
    elements.closeDeleteModal.addEventListener('click', closeDeleteModal);
    elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    
    // 点击模态框背景关闭
    elements.contactModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeContactModal();
        }
    });
    
    elements.deleteModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeDeleteModal();
        }
    });
    
    // 表单提交
    elements.contactForm.addEventListener('submit', handleFormSubmit);
    
    // 确认删除
    elements.confirmDeleteBtn.addEventListener('click', confirmDelete);
}

// ===== 加载联系人列表 =====
async function loadContacts(keyword = '') {
    try {
        showLoading();
        
        let url = API.list;
        if (keyword) {
            url += `?keyword=${encodeURIComponent(keyword)}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        hideLoading();
        
        if (result.success) {
            renderContacts(result.data);
            updateCount(result.count);
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('加载联系人列表失败，请检查后端服务是否启动', 'error');
        console.error('加载失败:', error);
    }
}

// ===== 渲染联系人列表 =====
function renderContacts(contacts) {
    if (!contacts || contacts.length === 0) {
        elements.contactsList.innerHTML = '';
        elements.emptyState.style.display = 'block';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    
    let html = '';
    contacts.forEach(contact => {
        html += `
            <div class="contact-card" data-id="${contact.id}">
                <div class="contact-header">
                    <div>
                        <div class="contact-name">${escapeHtml(contact.name)}</div>
                    </div>
                    <div class="contact-actions">
                        <button class="icon-btn edit" onclick="openEditModal(${contact.id})" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="icon-btn delete" onclick="openDeleteModal(${contact.id}, '${escapeHtml(contact.name)}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="contact-info">
                    <div class="info-item">
                        <i class="fas fa-phone"></i>
                        <span>${escapeHtml(contact.phone)}</span>
                    </div>
                    ${contact.email ? `
                        <div class="info-item">
                            <i class="fas fa-envelope"></i>
                            <span>${escapeHtml(contact.email)}</span>
                        </div>
                    ` : ''}
                    ${contact.address ? `
                        <div class="info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${escapeHtml(contact.address)}</span>
                        </div>
                    ` : ''}
                    ${contact.notes ? `
                        <div class="info-item">
                            <i class="fas fa-sticky-note"></i>
                            <span>${escapeHtml(contact.notes)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    elements.contactsList.innerHTML = html;
}

// ===== 更新计数 =====
function updateCount(count) {
    elements.contactCount.textContent = `共 ${count} 人`;
}

// ===== 打开新增模态框 =====
function openAddModal() {
    currentEditId = null;
    elements.modalTitle.textContent = '新增联系人';
    elements.contactForm.reset();
    elements.contactId.value = '';
    elements.contactModal.classList.add('show');
}

// ===== 打开编辑模态框 =====
async function openEditModal(id) {
    try {
        showLoading();
        
        // 从后端数据库读取最新数据（禁止使用缓存）
        const response = await fetch(`${API.get}?id=${id}&t=${Date.now()}`);
        const result = await response.json();
        
        hideLoading();
        
        if (result.success) {
            currentEditId = id;
            const contact = result.data;
            
            elements.modalTitle.textContent = '编辑联系人';
            elements.contactId.value = contact.id;
            elements.nameInput.value = contact.name;
            elements.phoneInput.value = contact.phone;
            elements.emailInput.value = contact.email || '';
            elements.addressInput.value = contact.address || '';
            elements.notesInput.value = contact.notes || '';
            
            elements.contactModal.classList.add('show');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('获取联系人信息失败', 'error');
        console.error('获取失败:', error);
    }
}

// ===== 关闭联系人模态框 =====
function closeContactModal() {
    elements.contactModal.classList.remove('show');
    elements.contactForm.reset();
    currentEditId = null;
}

// ===== 表单提交 =====
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // 获取表单数据
    const formData = {
        name: elements.nameInput.value.trim(),
        phone: elements.phoneInput.value.trim(),
        email: elements.emailInput.value.trim(),
        address: elements.addressInput.value.trim(),
        notes: elements.notesInput.value.trim()
    };
    
    // 验证
    if (!formData.name) {
        showToast('请输入姓名', 'error');
        elements.nameInput.focus();
        return;
    }
    
    if (!formData.phone) {
        showToast('请输入电话号码', 'error');
        elements.phoneInput.focus();
        return;
    }
    
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
        showToast('电话号码格式不正确', 'error');
        elements.phoneInput.focus();
        return;
    }
    
    try {
        showLoading();
        
        let url = API.add;
        let method = 'POST';
        
        if (currentEditId) {
            url = API.update;
            formData.id = currentEditId;
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        hideLoading();
        
        if (result.success) {
            showToast(result.message, 'success');
            closeContactModal();
            loadContacts(elements.searchInput.value.trim());
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('操作失败，请重试', 'error');
        console.error('提交失败:', error);
    }
}

// ===== 打开删除确认模态框 =====
function openDeleteModal(id, name) {
    deleteContactId = id;
    elements.deleteContactName.textContent = name;
    elements.deleteModal.classList.add('show');
}

// ===== 关闭删除模态框 =====
function closeDeleteModal() {
    elements.deleteModal.classList.remove('show');
    deleteContactId = null;
}

// ===== 确认删除 =====
async function confirmDelete() {
    if (!deleteContactId) return;
    
    try {
        showLoading();
        
        const response = await fetch(API.delete, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: deleteContactId })
        });
        
        const result = await response.json();
        
        hideLoading();
        
        if (result.success) {
            showToast(result.message, 'success');
            closeDeleteModal();
            loadContacts(elements.searchInput.value.trim());
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('删除失败，请重试', 'error');
        console.error('删除失败:', error);
    }
}

// ===== 显示加载提示 =====
function showLoading() {
    elements.loading.style.display = 'flex';
}

// ===== 隐藏加载提示 =====
function hideLoading() {
    elements.loading.style.display = 'none';
}

// ===== 显示Toast提示 =====
function showToast(message, type = 'success') {
    elements.toastMessage.textContent = message;
    elements.toast.className = 'toast show ' + type;
    
    // 更新图标
    const icon = elements.toast.querySelector('i');
    if (type === 'success') {
        icon.className = 'fas fa-check-circle';
    } else if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle';
    }
    
    // 3秒后自动隐藏
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// ===== HTML转义（防XSS攻击）=====
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// ===== 暴露全局函数供HTML调用 =====
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;

