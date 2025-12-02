/**
 * 前端配置文件
 * 配置后端API地址
 */

// 后端API基础地址配置
// 开发环境：如果前后端在同一服务器不同目录，使用相对路径
// 生产环境：配置完整的后端服务器地址
const API_CONFIG = {
    // 方式一：前后端在同一域名下（推荐用于开发）
    // 假设前端访问 http://localhost:8000/a/index.html
    // 后端地址为 http://localhost:8000/b/api/
    BASE_URL: '../b/api',
    
    // 方式二：后端独立服务器（生产环境）
    // BASE_URL: 'http://backend.example.com/api',
    
    // 方式三：使用绝对路径
    // BASE_URL: '/b/api'
};

// 导出配置
window.API_CONFIG = API_CONFIG;

