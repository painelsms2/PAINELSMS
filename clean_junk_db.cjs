const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SERVICE_CODES = {
  '99app': 'ki', 'agibank': 'sa', 'aliexpress': 'hx', 'amazon': 'am', 'asaas': 'bqr',
  'autodesk': 'bbl', 'badoo': 'qv', 'baidu': 'li', 'banqi': 'vc', 'beboo': 'abd',
  'bet365': 'ie', 'bipa': 'baj', 'bitso': 'ht', 'blablacar': 'ua', 'bradesco': 'ann',
  'brahma': 'sy', 'bv': 'avy', 'c6_bank': 'aff', 'coinbase': 're', 'corona': 'om',
  'crefisamais': 'ax', 'cruzeiro': 'ccl', 'cupidmedia': 'aje', 'daki': 'ahi', 'discord': 'ds',
  'dotz': 'xj', 'efi_bank': 'efi', 'enjoei': 'arf', 'ero_me': 'cau', 'etoro': 'apb',
  'facebook': 'fb', 'facily': 'alc', 'familhao': 'asl', 'fastearn': 'any', 'firebase': 'aim',
  'gappx': 'arg', 'getninjas': 'aiu', 'google': 'go', 'google_chat': 'ccu', 'googlemessenger': 'gmsg',
  'googlevoice': 'gf', 'govbr': 'afe', 'grindr': 'yw', 'guiche_web': 'alb', 'gurubets': 'ik',
  'icq': 'iq', 'ifood': 'pd', 'infinitepay': 'anx', 'instagram': 'ig', 'itau': 'btn',
  'iti': 'ad', 'kakaotalk': 'kt', 'kwai': 'vp', 'lalamove': 'fh', 'line_msg': 'me',
  'luup': 'beh', 'magalu': 'afq', 'mamba': 'fd', 'manus': 'bwv', 'meliuz': 'uy',
  'mercado': 'cq', 'meseems': 'amv', 'monzo': 'aom', 'moonpay': 'bgj', 'n_me_perturbe': 'axm',
  'natura_avon': 'awg', 'naver': 'nv', 'neon': 'aex', 'netflix': 'nf', 'next': 'aey',
  'ngcash': 'awh', 'nubank': 'aaa', 'okru': 'ok', 'okx': 'aor', 'olx': 'sn',
  'openai': 'dr', 'outlier': 'auz', 'outros': 'ot', 'pagbank': 'abg', 'parimatch': 'abf',
  'paysera': 'aol', 'pedir_gs': 'bqh', 'pgbonus': 'fx', 'picpay': 'ev', 'pofcom': 'pf',
  'premmia': 'anw', 'privalia': 'afs', 'protonmail': 'dp', 'queroq_pag': 'bxj', 'radquest': 'ayk',
  'rappi': 'aba', 'reclameaqui': 'aoz', 'revolut': 'ij', 'ripio': 'avp', 'santander': 'lj',
  'serasa': 'abj', 'shein': 'aez', 'shellbox': 'vg', 'shopee': 'ka', 'sicredi': 'ana',
  'skrill': 'aqt', 'snapchat': 'fu', 'soop': 'bxz', 'spaten': 'ky', 'telegram': 'tg',
  'temu': 'ep', 'tencent_qq': 'qq', 'tick': 'rb', 'ticketmaster': 'gp', 'tiktok': 'lf',
  'tinder': 'oi', 'totalpass': 'auc', 'twitch': 'hb', 'uber': 'ub', 'ubisoft': 'ahb',
  'ultragaz': 'afr', 'uol': 'abh', 'valora': 'bdw', 'viber': 'vi', 'vkcom': 'vk',
  'voltz': 'eb', 'walmart': 'wr', 'webmotors': 'bfa', 'wechat': 'wb', 'weststein': 'th',
  'whatsapp': 'wa', 'will': 'bsa', 'winzo': 'vs', 'wirex': 'baa', 'wise': 'bo',
  'xbox': 'aml', 'xiaomi': 'yu', 'yahoo': 'mb', 'yalla': 'yl', 'yandex': 'ya',
  'yowin': 'sm', 'zedelivery': 'em', 'zeenow': 'btm', 'zoho': 'zh'
};

const CODE_TO_NAME = {};
for (const [name, code] of Object.entries(SERVICE_CODES)) {
  CODE_TO_NAME[code] = name;
}

async function run() {
  const { data: services } = await supabase.from('services').select('*');
  
  const junkServices = services.filter(s => /^[A-Z0-9_]{2,5}$/.test(s.name));
  console.log(`Found ${junkServices.length} potential junk services.`);
  
  let deactivated = 0;
  let merged = 0;

  for (const junk of junkServices) {
    const codeLower = junk.name.toLowerCase();
    const realName = CODE_TO_NAME[codeLower];
    
    if (realName) {
      const realService = services.find(s => s.name.toLowerCase() === realName.toLowerCase());
      if (realService) {
        console.log(`Merging junk '${junk.name}' into real service '${realService.name}'...`);
        await supabase.from('service_offers').update({ service_id: realService.id }).eq('service_id', junk.id);
        await supabase.from('services').delete().eq('id', junk.id);
        merged++;
      } else {
        console.log(`No real service found for mapped '${realName}', deactivating junk '${junk.name}'`);
        await supabase.from('services').update({ active: false }).eq('id', junk.id);
        deactivated++;
      }
    } else {
      // Just deactivate it
      if (junk.active) {
        console.log(`No mapping for '${junk.name}', deactivating.`);
        await supabase.from('services').update({ active: false }).eq('id', junk.id);
        deactivated++;
      }
    }
  }
  
  console.log(`Cleanup complete. Merged: ${merged}, Deactivated: ${deactivated}`);
}

run();
