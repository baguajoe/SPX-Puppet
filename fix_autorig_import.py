#!/usr/bin/env python3
path = '/workspaces/SPX-Puppet/src/App.jsx'
with open(path, 'r') as f:
    content = f.read()

old = 'import AutoRigPanel from "./components/puppet/PuppetPanels.jsx";\nimport { TriggersPanel, MotionLibraryPanel, FacialSlidersPanel, CharacterLibraryPanel } from "./components/puppet/PuppetPanels.jsx";'
new = 'import { AutoRigPanel, TriggersPanel, MotionLibraryPanel, FacialSlidersPanel, CharacterLibraryPanel } from "./components/puppet/PuppetPanels.jsx";'

if old in content:
    content = content.replace(old, new)
    print('✓ Fixed AutoRigPanel import')
else:
    # try fixing just the default import line
    old2 = 'import AutoRigPanel from "./components/puppet/PuppetPanels.jsx";'
    new2 = 'import { AutoRigPanel } from "./components/puppet/PuppetPanels.jsx";'
    if old2 in content:
        content = content.replace(old2, new2)
        print('✓ Fixed AutoRigPanel default→named import')
    else:
        print('✗ Import line not found — check App.jsx')

with open(path, 'w') as f:
    f.write(content)
