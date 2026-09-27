import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // 支持的语言列表
  locales: ['en', 'zh', 'ja', 'ko', 'fa'],
  // 默认语言（当客户直接访问网址时，默认显示英文）
  defaultLocale: 'en'
});
 
export const config = {
  // 只拦截页面路由，不拦截图片、API等静态文件
  matcher: ['/', '/(zh|en|ja|ko|fa)/:path*']
};