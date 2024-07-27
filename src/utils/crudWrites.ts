import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import getTableSchema from './getTableSchema.js';

interface TableSchema {
  [key: string]: string | undefined;
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export async function createFileName(tableName: string, opName: string): Promise<string> {
  const currentPath = process.cwd();
  const destinationDir = path.join(currentPath, 'data', tableName);
  const destinationPath = path.join(destinationDir, `${opName}.ts`);
  try {
    await fs.promises.mkdir(destinationDir, { recursive: true });
    return destinationPath;
  }
  catch (error) {
    console.log(`An error occurred creating the path for ${tableName}: ${error.message}`);
    throw error;
  }
}

export async function createOps(tableName: string): Promise<void> {
  try {
    const schema = await getTableSchema(tableName);
    if (!schema) {
      throw new Error(`Schema for table '${tableName}' not found.`);
    }

    const properties = Object.entries(schema.Row)
      .map(([key, type]) => `  ${key}: ${type};`)
      .join('\n');

    const formattedTableName = capitalizeFirstLetter(tableName);
    const filePath = await createFileName(tableName, 'create');
    const content = `
import { supabase } from '@/utils/supabase/server';
// This is the default location for your SupaBase config in Nextjs projects.  you might have to edit this if you are using a different framework.

interface create${formattedTableName}Props {
${properties}
}

export async function create${formattedTableName}(data: create${formattedTableName}Props) {
  const { data: result, error } = await supabase
    .from('${tableName}')
    .insert(data)
    .select();
  
  if (error) throw error;
  return result;
}
`.trim();

    await fs.promises.writeFile(filePath, content);
    console.log(chalk.green(`Create operation file created successfully at ${filePath}`));
  } catch (error) {
    console.error(chalk.red(`Error creating create operation file: ${error.message}`));
  }
}

export async function readOps(tableName: string): Promise<void> {
  try {
    const formattedTableName = capitalizeFirstLetter(tableName);
    const filePath = await createFileName(tableName, 'read');
    const content = `
import { supabase } from '@/utils/supabase/server';
// This is the default location for your SupaBase config in Nextjs projects.  you might have to edit this if you are using a different framework.

export async function read${formattedTableName}(id?: string) {
  let query = supabase.from('${tableName}').select('*');
  
  if (id) {
    query = query.eq('id', id);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}
`.trim();
    await fs.promises.writeFile(filePath, content);
    console.log(chalk.green(`Read operation file created successfully at ${filePath}`));
  } catch (error) {
    console.error(chalk.red(`Error creating read operation file: ${error.message}`));
  }
}

export async function updateOps(tableName: string): Promise<void> {
  try {
    const formattedTableName = capitalizeFirstLetter(tableName);
    const filePath = await createFileName(tableName, 'update');
    const content = `
import { supabase } from '@/utils/supabase/server';
// This is the default location for your SupaBase config in Nextjs projects.  You might have to edit this if you are using a different framework.

export async function update${formattedTableName}(id: string, data: any) {
  const { data: result, error } = await supabase
    .from('${tableName}')
    .update(data)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return result;
}
`.trim();
    await fs.promises.writeFile(filePath, content);
    console.log(chalk.green(`Update operation file created successfully at ${filePath}`));
  } catch (error) {
    console.error(chalk.red(`Error creating update operation file: ${error.message}`));
  }
}

export async function deleteOps(tableName: string): Promise<void> {
  try {
    const formattedTableName = capitalizeFirstLetter(tableName);
    const filePath = await createFileName(tableName, 'delete');
    const content = `
import { createClient } from '@/utils/supabase/server';
// This is the default location for your SupaBase config in Nextjs projects.  You might have to edit this if you are using a different framework.

interface delete${tableName}Props {
  id: string;
}

export async function delete${tableName}(id: delete${tableName}Props) {
  const supabase = await createClient();

  const { error } = await supabase.from('${tableName}').delete().eq('id', id);
  if (error) {
    throw new Error(\`Error deleting data: \${error.message}\`);
  }

  return { success: true };
}
`.trim();
    await fs.promises.writeFile(filePath, content);
    console.log(chalk.green(`Delete operation file created successfully at ${filePath}`));
  } catch (error) {
    console.error(chalk.red(`Error creating delete operation file: ${error.message}`));
  }
}

export async function listOps(tableName: string): Promise<void> {
  try {
    const formattedTableName = capitalizeFirstLetter(tableName);
    const filePath = await createFileName(tableName, 'list');
    const content =
      `
import { createClient } from "@/utils/supabase/server";

export default async function get${formattedTableName}(){
    const supabase = await createClient();
    const { data: ${tableName}, error } = await supabase
    .from('${tableName}')
    .select('*')
    .order('date', { ascending: true });
    
    if (error) {
        throw new Error(\`An error occured retreiving data \${error.message}\`)
    }
    return ${tableName};
}
`.trim();

    await fs.promises.writeFile(filePath, content);
  } catch (error) {
    console.error(chalk.red(`Error creating list operation file: ${error.message}`));
  }
}


export async function allOps(tableName: string): Promise<void> {
  await createOps(tableName);
  await readOps(tableName);
  await updateOps(tableName);
  await deleteOps(tableName);
  await listOps(tableName);
  console.log(chalk.green(`All CRUD operation files generated for table: ${tableName}`));
}