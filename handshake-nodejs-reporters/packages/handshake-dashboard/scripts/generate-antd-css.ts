import { writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { extractStyle } from '@ant-design/static-style-extract';
import withTheme from '../src/components/theme';

const outputPath = './public/antd.min.css';

if (existsSync(outputPath)) unlinkSync(outputPath);

const css = extractStyle(withTheme);
writeFileSync(outputPath, css);
console.log(`🎉 Antd CSS generated at ${outputPath}`);
