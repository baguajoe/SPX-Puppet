#!/usr/bin/env python3
path = '/workspaces/SPX-Puppet/src/components/puppet/PuppetPanels.jsx'
with open(path, 'r') as f:
    content = f.read()

# The AutoRigPanel section appended its own const S — rename it to SA
old = '''import { autoRigImage } from '../../utils/PuppetAutoRig.js';

const S = {
  root:   { padding:16, color:'#e0e0e0', fontFamily:'JetBrains Mono,monospace', fontSize:12 },
  title:  { color:'#00ffc8', fontSize:13, fontWeight:700, marginBottom:12 },
  drop:   { border:'2px dashed #333', borderRadius:8, padding:32, textAlign:'center', cursor:'pointer', color:'#555', fontSize:11, marginBottom:12 },
  btn:    (c='#00ffc8') => ({ padding:'6px 16px', border:`1px solid ${c}`, borderRadius:4, background:'transparent', color:c, cursor:'pointer', fontSize:11, margin:'4px 2px' }),
  status: { color:'#FF6600', fontSize:10, marginTop:8, minHeight:16 },
  preview:{ width:'100%', borderRadius:6, marginTop:8, border:'1px solid #222' },
  joint:  { display:'flex', justifyContent:'space-between', padding:'3px 6px', borderBottom:'1px solid #111', fontSize:10 },
};'''

new = '''import { autoRigImage } from '../../utils/PuppetAutoRig.js';

const SA = {
  root:   { padding:16, color:'#e0e0e0', fontFamily:'JetBrains Mono,monospace', fontSize:12 },
  title:  { color:'#00ffc8', fontSize:13, fontWeight:700, marginBottom:12 },
  drop:   { border:'2px dashed #333', borderRadius:8, padding:32, textAlign:'center', cursor:'pointer', color:'#555', fontSize:11, marginBottom:12 },
  btn:    (c='#00ffc8') => ({ padding:'6px 16px', border:`1px solid ${c}`, borderRadius:4, background:'transparent', color:c, cursor:'pointer', fontSize:11, margin:'4px 2px' }),
  status: { color:'#FF6600', fontSize:10, marginTop:8, minHeight:16 },
  preview:{ width:'100%', borderRadius:6, marginTop:8, border:'1px solid #222' },
  joint:  { display:'flex', justifyContent:'space-between', padding:'3px 6px', borderBottom:'1px solid #111', fontSize:10 },
};'''

if old in content:
    content = content.replace(old, new)
    print('✓ Renamed duplicate S → SA')
else:
    print('✗ Pattern not found — trying alternate fix')
    # Just replace second occurrence of 'const S = {'
    first = content.find('const S = {')
    second = content.find('const S = {', first + 1)
    if second != -1:
        content = content[:second] + 'const SA = {' + content[second+12:]
        print('✓ Replaced second const S with SA')
    else:
        print('✗ Could not find second const S')

# Now replace all S. references in AutoRigPanel section (after the SA declaration)
# Find where SA is declared and replace S. with SA. only in that section
sa_pos = content.find('const SA = {')
if sa_pos != -1:
    before = content[:sa_pos]
    after  = content[sa_pos:]
    # In the AutoRigPanel section, replace S. with SA. but not inside strings
    import re
    after = re.sub(r'\bS\.', 'SA.', after)
    content = before + after
    print('✓ Updated S. → SA. in AutoRigPanel section')

with open(path, 'w') as f:
    f.write(content)
print('Done')
