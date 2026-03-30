#!/usr/bin/env python3
# =============================================================================
# install_puppet_features.py
# Run from: /workspaces/SPX-Puppet
# python3 install_puppet_features.py && npm run build && git add -A && git commit -m "feat: auto-rig, cycles, triggers, motion library, facial sliders, character library, magnets, sprite sheets" && git push
# =============================================================================

import os, shutil

ROOT   = '/workspaces/SPX-Puppet'
UTILS  = f'{ROOT}/src/utils'
COMP   = f'{ROOT}/src/components'
PUPPET = f'{COMP}/puppet'
APP    = f'{ROOT}/src/App.jsx'
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

os.makedirs(PUPPET, exist_ok=True)

# ── 1. copy utils ─────────────────────────────────────────────────────────────
UTILS_FILES = [
    'PuppetAutoRig.js',
    'PuppetCycleLayers.js',
    'PuppetTriggers.js',
    'PuppetMotionLibrary.js',
    'PuppetCharacterLibrary.js',
    'PuppetMagnets.js',
    'PuppetFacialSliders.js',
]

for f in UTILS_FILES:
    src = os.path.join(SCRIPT_DIR, f)
    dst = os.path.join(UTILS, f)
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f'✓ {f} → utils/')
    else:
        print(f'✗ {f} not found in script dir')

# ── 2. split PuppetPanels.jsx into individual files ───────────────────────────
PANELS_SRC = os.path.join(SCRIPT_DIR, 'PuppetPanels.jsx')
if os.path.exists(PANELS_SRC):
    with open(PANELS_SRC, 'r') as f:
        content = f.read()

    # AutoRigPanel — from start to first export function
    # We'll write each as a separate file by splitting on the separator comments
    sections = content.split('// =============================================================================\n')

    panel_map = {
        'AutoRigPanel':        'AutoRigPanel.jsx',
        'TriggersPanel':       'TriggersPanel.jsx',
        'MotionLibraryPanel':  'MotionLibraryPanel.jsx',
        'FacialSlidersPanel':  'FacialSlidersPanel.jsx',
        'CharacterLibraryPanel':'CharacterLibraryPanel.jsx',
    }

    # write full combined file — App.jsx imports individual exports from it
    dst = os.path.join(PUPPET, 'PuppetPanels.jsx')
    shutil.copy2(PANELS_SRC, dst)
    print(f'✓ PuppetPanels.jsx → components/puppet/')
else:
    print('✗ PuppetPanels.jsx not found')

# ── 3. wire into App.jsx ──────────────────────────────────────────────────────
with open(APP, 'r') as f:
    app = f.read()

IMPORT_ANCHOR = 'import DrawPanel from "./components/puppet/DrawPanel.jsx";'

NEW_IMPORTS = '''import DrawPanel from "./components/puppet/DrawPanel.jsx";
import AutoRigPanel from "./components/puppet/PuppetPanels.jsx";
import { TriggersPanel, MotionLibraryPanel, FacialSlidersPanel, CharacterLibraryPanel } from "./components/puppet/PuppetPanels.jsx";
import { CyclePlayer, startAutoBlink } from "./utils/PuppetCycleLayers.js";
import { MagnetSystem } from "./utils/PuppetMagnets.js";'''

if 'AutoRigPanel' not in app:
    app = app.replace(IMPORT_ANCHOR, NEW_IMPORTS)
    print('✓ New imports added')
else:
    print('✓ Imports already present')

# ── 4. add panel nav entries ──────────────────────────────────────────────────
OLD_PANELS = '''{ id:"draw",       label:"✏ Draw"       },'''
NEW_PANELS = '''{ id:"draw",       label:"✏ Draw"       },
    { id:"autorig",    label:"🦾 Auto-Rig"   },
    { id:"triggers",   label:"⌨️ Triggers"   },
    { id:"motions",    label:"🎬 Motions"    },
    { id:"facesliders",label:"😊 Face"       },
    { id:"charlibrary",label:"🎭 Library"    },'''

if 'autorig' not in app:
    if OLD_PANELS in app:
        app = app.replace(OLD_PANELS, NEW_PANELS)
        print('✓ Panel nav entries added')
    else:
        print('✗ Panel nav anchor not found — check App.jsx manually')
else:
    print('✓ Panel nav already present')

# ── 5. add panel render blocks ────────────────────────────────────────────────
OLD_DRAW_PANEL = '''{activePanel === "draw" && ('''
NEW_PANELS_RENDER = '''{activePanel === "autorig" && (
              <AutoRigPanel
                onRigComplete={(rig) => {
                  const active = characters.find(c => c.id === activeId);
                  if (active) setCharacters(cs => cs.map(c => c.id === activeId ? { ...c, rig } : c));
                }}
                setStatus={setStatus}
              />
            )}
            {activePanel === "triggers" && (
              <TriggersPanel
                onCycle={(name) => {
                  if (!window._cyclePlayer) {
                    window._cyclePlayer = new CyclePlayer();
                    window._cyclePlayer.on((n, frame) => {
                      Object.entries(frame).forEach(([joint, delta]) => {
                        setCharacters(cs => cs.map(c => c.id === activeId ? {
                          ...c,
                          joints: { ...c.joints, [joint]: { ...(c.joints?.[joint]||{}), rot: (c.joints?.[joint]?.rot||0) + (delta.rot||0), dy: (c.joints?.[joint]?.dy||0) + (delta.dy||0) } }
                        } : c));
                      });
                    });
                  }
                  window._cyclePlayer.toggle(name);
                }}
                onExpression={(expr) => setExpression?.(expr)}
                setStatus={setStatus}
              />
            )}
            {activePanel === "motions" && (
              <MotionLibraryPanel
                onMotionFrame={(frame) => {
                  Object.entries(frame).forEach(([joint, delta]) => {
                    setCharacters(cs => cs.map(c => c.id === activeId ? {
                      ...c,
                      joints: { ...c.joints, [joint]: { ...(c.joints?.[joint]||{}),
                        rot: (delta.rot !== undefined ? delta.rot : (c.joints?.[joint]?.rot||0)),
                        dy:  (delta.dy  !== undefined ? delta.dy  : (c.joints?.[joint]?.dy ||0)),
                      }}
                    } : c));
                  });
                }}
                setStatus={setStatus}
              />
            )}
            {activePanel === "facesliders" && (
              <FacialSlidersPanel
                onFacialUpdate={(state) => setMouthShape?.(state.mouthOpen)}
                setStatus={setStatus}
              />
            )}
            {activePanel === "charlibrary" && (
              <CharacterLibraryPanel
                onAddCharacter={(char) => {
                  const newChar = { ...char, id: `char_${Date.now()}` };
                  setCharacters(cs => [...cs, newChar]);
                  setActiveId(newChar.id);
                  setStatus(`Added ${char.name}`);
                }}
                setStatus={setStatus}
              />
            )}
            {activePanel === "draw" && ('''

if 'autorig' not in app:
    if OLD_DRAW_PANEL in app:
        app = app.replace(OLD_DRAW_PANEL, NEW_PANELS_RENDER)
        print('✓ Panel render blocks added')
    else:
        print('✗ Draw panel anchor not found')
else:
    print('✓ Render blocks already present')

# ── 6. write App.jsx ──────────────────────────────────────────────────────────
with open(APP, 'w') as f:
    f.write(app)
print('✓ App.jsx updated')

print('\n✅ Install complete')
print('Run: npm run build 2>&1 | tail -6')
