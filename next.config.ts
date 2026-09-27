import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

// 明确告诉系统我们的配置文件位置
const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);