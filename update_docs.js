import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectDir = __dirname;
const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.md') && f !== 'SUPABASE_AUTH_MIGRATION.md');

const replacements = [
  { search: /Manus OAuth/gi, replace: 'Supabase Auth' },
  { search: /Manus/g, replace: 'Supabase Auth' }, // Safeish replace
  { search: /OAUTH_SERVER_URL/g, replace: 'VITE_SUPABASE_URL' },
  { search: /VITE_OAUTH_PORTAL_URL/g, replace: 'VITE_SUPABASE_ANON_KEY' },
  { search: /VITE_APP_ID=\[seu-app-id-manus\]/g, replace: 'SUPABASE_SERVICE_ROLE_KEY=[sua-chave-service-role]' },
  { search: /MySQL/gi, replace: 'PostgreSQL' },
  { search: /drizzle-orm\/mysql2/g, replace: 'drizzle-orm/postgres-js' },
  { search: /mysql:\/\//g, replace: 'postgresql://' },
  { search: /planetscale/gi, replace: 'supabase' },
];

files.forEach(file => {
  const filePath = path.join(projectDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Specific fixes to avoid weird string building
  content = content.replace(/- \*\*Supabase Auth\*\* \(para OAuth\): Já configurado no template/g, '- **Supabase Auth**: Configurado para gestão de usuários');
  content = content.replace(/- \*\*Manus\*\* \(para OAuth\): Já configurado no template/g, '- **Supabase Auth**: Configurado para gestão de usuários');
  content = content.replace(/Autenticação OAuth integrada/g, 'Autenticação Supabase integrada');
  content = content.replace(/Noções de autenticação OAuth/g, 'Noções de autenticação Supabase');
  
  // Custom Flow descriptions overriding
  content = content.replace(/O usuário faz login via Supabase Auth OAuth/g, 'O usuário faz request de acesso e aguarda aprovação do SuperAdmin');
  content = content.replace(/O usuário faz login via Manus OAuth/g, 'O usuário faz request de acesso e aguarda aprovação do SuperAdmin');
  content = content.replace(/Integração OAuth/g, 'Integração Supabase Auth');

  replacements.forEach(({ search, replace }) => {
    content = content.replace(search, replace);
  });

  // Cleanup potential redundant replacements
  content = content.replace(/Supabase Auth Auth/g, 'Supabase Auth');
  content = content.replace(/\[seu-app-id-Supabase Auth\]/g, '[sua-chave-service-role]');
  content = content.replace(/https:\/\/api\.Supabase Auth\.im/g, 'https://[project-id].supabase.co');
  content = content.replace(/https:\/\/portal\.Supabase Auth\.im/g, '[sua-chave-anon]');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});

console.log('Documentation updated successfully.');
