import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({requestLocale}) => {
  // 尝试获取当前请求的语言，如果获取不到，强制保底使用英文 'en'
  let locale = (await requestLocale) || 'en';
  
  const locales = ['en', 'zh', 'ja', 'ko', 'fa'];

  // 如果请求的语言不在我们的列表里，也强制回退到英文，而不是抛出 404
  if (!locales.includes(locale)) {
    locale = 'en';
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});