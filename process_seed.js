import fs from 'fs';

const content = fs.readFileSync('supabase/seed.sql', 'utf8');

// Replace service_key with id
let newContent = content.replace(/insert into public\.services \(service_key,/gi, 'insert into public.services (id,');
newContent = newContent.replace(/on conflict \(service_key\)/gi, 'on conflict (id)');

// We need to add icon_file.
// Let's replace the column definition line:
newContent = newContent.replace(
  /insert into public\.services \(id, name, cost_price, sale_price, country, stock, active\) values/gi,
  'insert into public.services (id, name, cost_price, sale_price, country, stock, active, icon_file) values'
);

// We need to append ', 'slug')' to each value line.
// Example line:   ('99app', '99app', 0.80, 1.60, 'Brasil', 0, true),
// We can use a regex replacement.

newContent = newContent.replace(/\('([^']+)',\s*'([^']+)',\s*([\d.]+),\s*([\d.]+),\s*'([^']+)',\s*(\d+),\s*(true|false)\)(,|)/g, (match, id, name, cost, sale, country, stock, active, comma) => {
  // convert id to a simple-icons valid slug if possible
  let slug = id.toLowerCase()
    .replace(/_bank/, '') // e.g. c6_bank -> c6
    .replace(/_/, '') // e.g. ok_ru -> okru
    .replace(/\./, 'dot') // pof.com -> pofdotcom
  
  if (slug === 'outros') slug = ''; // no icon
  
  return `('${id}', '${name}', ${cost}, ${sale}, '${country}', ${stock}, ${active}, ${slug ? `'${slug}'` : 'null'})${comma}`;
});

// also we need to add icon_file = EXCLUDED.icon_file in the update
newContent = newContent.replace(
  /name = excluded\.name;/gi,
  'name = EXCLUDED.name,\n  icon_file = EXCLUDED.icon_file;'
);

fs.writeFileSync('supabase/seed.sql', newContent);
console.log('Updated seed.sql');
