// ============================================================================
// GALAXY LAUNCHER - CONTENT METADATA & ICON ENRICHMENT SERVICE
// Provides instant high-res CDN icons, authors, and descriptions for mods,
// resource packs, and shaders, with persistent caching and live Modrinth lookup.
// ============================================================================

export interface EnrichedContentMetadata {
  displayName?: string;
  icon?: string;
  author?: string;
  authorAvatar?: string;
  description?: string;
  url?: string;
}

// In-memory cache + LocalStorage backed cache
const LOCAL_STORAGE_KEY = 'galaxy_mod_metadata_cache_v2';

function getPersistentCache(): Record<string, EnrichedContentMetadata> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setPersistentCache(key: string, data: EnrichedContentMetadata) {
  try {
    const cache = getPersistentCache();
    cache[key.toLowerCase()] = data;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // quota or storage disabled
  }
}

// Curated high-res catalog of popular Minecraft mods
const CURATED_MODS_CATALOG: Record<string, EnrichedContentMetadata> = {
  '3dskinlayers': {
    displayName: '3D-Skin-Layers',
    author: 'tr7zw',
    authorAvatar: 'https://cdn.modrinth.com/data/zV5r3pPn/icon.png',
    description: 'Renders the player skin layer in 3D for a better visual experience.',
    icon: 'https://cdn.modrinth.com/data/zV5r3pPn/icon.png',
    url: 'https://modrinth.com/mod/3dskinlayers'
  },
  '3d-skin-layers': {
    displayName: '3D-Skin-Layers',
    author: 'tr7zw',
    authorAvatar: 'https://cdn.modrinth.com/data/zV5r3pPn/icon.png',
    description: 'Renders the player skin layer in 3D for a better visual experience.',
    icon: 'https://cdn.modrinth.com/data/zV5r3pPn/icon.png',
    url: 'https://modrinth.com/mod/3dskinlayers'
  },
  'appleskin': {
    displayName: 'AppleSkin',
    author: 'squeek502',
    authorAvatar: 'https://cdn.modrinth.com/data/EsAfCjCV/icon.png',
    description: 'Shows food and saturation information on the HUD.',
    icon: 'https://cdn.modrinth.com/data/EsAfCjCV/icon.png',
    url: 'https://modrinth.com/mod/appleskin'
  },
  'cloth-config': {
    displayName: 'Cloth Config',
    author: 'shedaniel',
    authorAvatar: 'https://cdn.modrinth.com/data/9s6Sm095/icon.png',
    description: 'A config screen API for mod developers.',
    icon: 'https://cdn.modrinth.com/data/9s6Sm095/icon.png',
    url: 'https://modrinth.com/mod/cloth-config'
  },
  'cloth_config': {
    displayName: 'Cloth Config',
    author: 'shedaniel',
    authorAvatar: 'https://cdn.modrinth.com/data/9s6Sm095/icon.png',
    description: 'A config screen API for mod developers.',
    icon: 'https://cdn.modrinth.com/data/9s6Sm095/icon.png',
    url: 'https://modrinth.com/mod/cloth-config'
  },
  'cloth-config2': {
    displayName: 'Cloth Config',
    author: 'shedaniel',
    authorAvatar: 'https://cdn.modrinth.com/data/9s6Sm095/icon.png',
    description: 'A config screen API for mod developers.',
    icon: 'https://cdn.modrinth.com/data/9s6Sm095/icon.png',
    url: 'https://modrinth.com/mod/cloth-config'
  },
  'fabric-api': {
    displayName: 'Fabric API',
    author: 'FabricMC',
    authorAvatar: 'https://cdn.modrinth.com/data/P7dR8mSH/icon.png',
    description: 'Core API module required by most Fabric mods.',
    icon: 'https://cdn.modrinth.com/data/P7dR8mSH/icon.png',
    url: 'https://modrinth.com/mod/fabric-api'
  },
  'fabric_api': {
    displayName: 'Fabric API',
    author: 'FabricMC',
    authorAvatar: 'https://cdn.modrinth.com/data/P7dR8mSH/icon.png',
    description: 'Core API module required by most Fabric mods.',
    icon: 'https://cdn.modrinth.com/data/P7dR8mSH/icon.png',
    url: 'https://modrinth.com/mod/fabric-api'
  },
  'fabric': {
    displayName: 'Fabric API',
    author: 'FabricMC',
    authorAvatar: 'https://cdn.modrinth.com/data/P7dR8mSH/icon.png',
    description: 'Core API module required by most Fabric mods.',
    icon: 'https://cdn.modrinth.com/data/P7dR8mSH/icon.png',
    url: 'https://modrinth.com/mod/fabric-api'
  },
  'iris': {
    displayName: 'Iris Shaders',
    author: 'coderbot',
    authorAvatar: 'https://cdn.modrinth.com/data/YL57xq9U/icon.png',
    description: 'A modern shader mod for Fabric.',
    icon: 'https://cdn.modrinth.com/data/YL57xq9U/icon.png',
    url: 'https://modrinth.com/mod/iris'
  },
  'iris-fabric': {
    displayName: 'Iris Shaders',
    author: 'coderbot',
    authorAvatar: 'https://cdn.modrinth.com/data/YL57xq9U/icon.png',
    description: 'A modern shader mod for Fabric.',
    icon: 'https://cdn.modrinth.com/data/YL57xq9U/icon.png',
    url: 'https://modrinth.com/mod/iris'
  },
  'jade': {
    displayName: 'Jade',
    author: 'Snownee',
    authorAvatar: 'https://cdn.modrinth.com/data/nvbUt13K/icon.png',
    description: 'Shows what you are looking at in-game.',
    icon: 'https://cdn.modrinth.com/data/nvbUt13K/icon.png',
    url: 'https://modrinth.com/mod/jade'
  },
  'journeymap': {
    displayName: 'JourneyMap',
    author: 'Mysticdrew',
    authorAvatar: 'https://cdn.modrinth.com/data/mOgUt4GM/icon.png',
    description: 'Real-time mapping in your world.',
    icon: 'https://cdn.modrinth.com/data/mOgUt4GM/icon.png',
    url: 'https://modrinth.com/mod/journeymap'
  },
  'jei': {
    displayName: 'Just Enough Items (JEI)',
    author: 'mezz',
    authorAvatar: 'https://cdn.modrinth.com/data/u6dRKJwZ/icon.png',
    description: 'View items and recipes in-game.',
    icon: 'https://cdn.modrinth.com/data/u6dRKJwZ/icon.png',
    url: 'https://modrinth.com/mod/jei'
  },
  'just-enough-items': {
    displayName: 'Just Enough Items (JEI)',
    author: 'mezz',
    authorAvatar: 'https://cdn.modrinth.com/data/u6dRKJwZ/icon.png',
    description: 'View items and recipes in-game.',
    icon: 'https://cdn.modrinth.com/data/u6dRKJwZ/icon.png',
    url: 'https://modrinth.com/mod/jei'
  },
  'lithium': {
    displayName: 'Lithium',
    author: 'JellySquid',
    authorAvatar: 'https://cdn.modrinth.com/data/gvQqBUqZ/icon.png',
    description: 'Optimization mod to improve performance.',
    icon: 'https://cdn.modrinth.com/data/gvQqBUqZ/icon.png',
    url: 'https://modrinth.com/mod/lithium'
  },
  'sodium': {
    displayName: 'Sodium',
    author: 'JellySquid',
    authorAvatar: 'https://cdn.modrinth.com/data/AANobbMI/icon.png',
    description: 'Modern rendering engine and performance optimization.',
    icon: 'https://cdn.modrinth.com/data/AANobbMI/icon.png',
    url: 'https://modrinth.com/mod/sodium'
  },
  'ferritecore': {
    displayName: 'FerriteCore',
    author: 'malte0811',
    authorAvatar: 'https://cdn.modrinth.com/data/uXXizFIs/icon.png',
    description: 'Memory usage optimizations for Minecraft.',
    icon: 'https://cdn.modrinth.com/data/uXXizFIs/icon.png',
    url: 'https://modrinth.com/mod/ferrite-core'
  },
  'ferrite-core': {
    displayName: 'FerriteCore',
    author: 'malte0811',
    authorAvatar: 'https://cdn.modrinth.com/data/uXXizFIs/icon.png',
    description: 'Memory usage optimizations for Minecraft.',
    icon: 'https://cdn.modrinth.com/data/uXXizFIs/icon.png',
    url: 'https://modrinth.com/mod/ferrite-core'
  },
  'indium': {
    displayName: 'Indium',
    author: 'comp500',
    authorAvatar: 'https://cdn.modrinth.com/data/Orvt0mRa/icon.png',
    description: 'Sodium addon providing support for the Fabric Rendering API.',
    icon: 'https://cdn.modrinth.com/data/Orvt0mRa/icon.png',
    url: 'https://modrinth.com/mod/indium'
  },
  'modmenu': {
    displayName: 'Mod Menu',
    author: 'TerraformersMC',
    authorAvatar: 'https://cdn.modrinth.com/data/mOgUt4GM/icon.png',
    description: 'Adds a mod menu to view the list of installed mods.',
    icon: 'https://cdn.modrinth.com/data/mOgUt4GM/icon.png',
    url: 'https://modrinth.com/mod/modmenu'
  },
  'mod-menu': {
    displayName: 'Mod Menu',
    author: 'TerraformersMC',
    authorAvatar: 'https://cdn.modrinth.com/data/mOgUt4GM/icon.png',
    description: 'Adds a mod menu to view the list of installed mods.',
    icon: 'https://cdn.modrinth.com/data/mOgUt4GM/icon.png',
    url: 'https://modrinth.com/mod/modmenu'
  },
  'entityculling': {
    displayName: 'Entity Culling',
    author: 'tr7zw',
    authorAvatar: 'https://cdn.modrinth.com/data/NNAgCjsB/icon.png',
    description: 'Culls entities and block entities behind blocks to improve FPS.',
    icon: 'https://cdn.modrinth.com/data/NNAgCjsB/icon.png',
    url: 'https://modrinth.com/mod/entityculling'
  },
  'immediatelyfast': {
    displayName: 'ImmediatelyFast',
    author: 'RaphiMC',
    authorAvatar: 'https://cdn.modrinth.com/data/5ZwdcRci/icon.png',
    description: 'Speed up immediate mode rendering in Minecraft.',
    icon: 'https://cdn.modrinth.com/data/5ZwdcRci/icon.png',
    url: 'https://modrinth.com/mod/immediatelyfast'
  },
  'continuity': {
    displayName: 'Continuity',
    author: 'PepperCode1',
    authorAvatar: 'https://cdn.modrinth.com/data/1IjD5062/icon.png',
    description: 'Connected textures support for Fabric.',
    icon: 'https://cdn.modrinth.com/data/1IjD5062/icon.png',
    url: 'https://modrinth.com/mod/continuity'
  },
  'reeses-sodium-options': {
    displayName: "Reese's Sodium Options",
    author: 'FlashyReese',
    authorAvatar: 'https://cdn.modrinth.com/data/Bh37bBMW/icon.png',
    description: "Replaces Sodium's options screen with a cleaner interface.",
    icon: 'https://cdn.modrinth.com/data/Bh37bBMW/icon.png',
    url: 'https://modrinth.com/mod/reeses-sodium-options'
  },
  'sodium-extra': {
    displayName: 'Sodium Extra',
    author: 'FlashyReese',
    authorAvatar: 'https://cdn.modrinth.com/data/PtjYWJkn/icon.png',
    description: "Features that shouldn't be in Sodium.",
    icon: 'https://cdn.modrinth.com/data/PtjYWJkn/icon.png',
    url: 'https://modrinth.com/mod/sodium-extra'
  },
  'dynamic-fps': {
    displayName: 'Dynamic FPS',
    author: 'juliand665',
    authorAvatar: 'https://cdn.modrinth.com/data/LQ3K71Q1/icon.png',
    description: 'Reduce resource usage when Minecraft is in background.',
    icon: 'https://cdn.modrinth.com/data/LQ3K71Q1/icon.png',
    url: 'https://modrinth.com/mod/dynamic-fps'
  },
  'yacl': {
    displayName: 'YetAnotherConfigLib (YACL)',
    author: 'isXander',
    authorAvatar: 'https://cdn.modrinth.com/data/1eAoo2KR/icon.png',
    description: 'A GUI configuration library for modern Minecraft.',
    icon: 'https://cdn.modrinth.com/data/1eAoo2KR/icon.png',
    url: 'https://modrinth.com/mod/yacl'
  },
  'yetanotherconfiglib': {
    displayName: 'YetAnotherConfigLib (YACL)',
    author: 'isXander',
    authorAvatar: 'https://cdn.modrinth.com/data/1eAoo2KR/icon.png',
    description: 'A GUI configuration library for modern Minecraft.',
    icon: 'https://cdn.modrinth.com/data/1eAoo2KR/icon.png',
    url: 'https://modrinth.com/mod/yacl'
  },
  'architectury': {
    displayName: 'Architectury API',
    author: 'shedaniel',
    authorAvatar: 'https://cdn.modrinth.com/data/lhGA9TYQ/icon.png',
    description: 'An intermediary api aimed to ease developing multiplatform mods.',
    icon: 'https://cdn.modrinth.com/data/lhGA9TYQ/icon.png',
    url: 'https://modrinth.com/mod/architectury-api'
  },
  'roughlyenoughitems': {
    displayName: 'Roughly Enough Items (REI)',
    author: 'shedaniel',
    authorAvatar: 'https://cdn.modrinth.com/data/nfn13YXA/icon.png',
    description: 'Clean and customizable recipe viewer.',
    icon: 'https://cdn.modrinth.com/data/nfn13YXA/icon.png',
    url: 'https://modrinth.com/mod/rei'
  },
  'rei': {
    displayName: 'Roughly Enough Items (REI)',
    author: 'shedaniel',
    authorAvatar: 'https://cdn.modrinth.com/data/nfn13YXA/icon.png',
    description: 'Clean and customizable recipe viewer.',
    icon: 'https://cdn.modrinth.com/data/nfn13YXA/icon.png',
    url: 'https://modrinth.com/mod/rei'
  },
  'emi': {
    displayName: 'EMI',
    author: 'emi',
    authorAvatar: 'https://cdn.modrinth.com/data/fALzjRMS/icon.png',
    description: 'A featureful and clean item and recipe viewer.',
    icon: 'https://cdn.modrinth.com/data/fALzjRMS/icon.png',
    url: 'https://modrinth.com/mod/emi'
  },
  'voicechat': {
    displayName: 'Simple Voice Chat',
    author: 'henkelmax',
    authorAvatar: 'https://cdn.modrinth.com/data/9eGKb6K1/icon.png',
    description: 'A proximity voice chat for Minecraft.',
    icon: 'https://cdn.modrinth.com/data/9eGKb6K1/icon.png',
    url: 'https://modrinth.com/mod/simple-voice-chat'
  },
  'nochatreports': {
    displayName: 'No Chat Reports',
    author: 'Aizistral',
    authorAvatar: 'https://cdn.modrinth.com/data/qQyHxfxd/icon.png',
    description: 'Protects player chat from cryptographic reporting.',
    icon: 'https://cdn.modrinth.com/data/qQyHxfxd/icon.png',
    url: 'https://modrinth.com/mod/no-chat-reports'
  },
  'presencefootsteps': {
    displayName: 'Presence Footsteps',
    author: 'Sollace',
    authorAvatar: 'https://cdn.modrinth.com/data/r4414vII/icon.png',
    description: 'An acoustic overhaul to Minecraft footsteps.',
    icon: 'https://cdn.modrinth.com/data/r4414vII/icon.png',
    url: 'https://modrinth.com/mod/presence-footsteps'
  },
  'waveycapes': {
    displayName: 'Wavey Capes',
    author: 'tr7zw',
    authorAvatar: 'https://cdn.modrinth.com/data/b1CWxRhP/icon.png',
    description: 'Adds wave physics to player capes.',
    icon: 'https://cdn.modrinth.com/data/b1CWxRhP/icon.png',
    url: 'https://modrinth.com/mod/wavey-capes'
  },
  'notenoughanimations': {
    displayName: 'Not Enough Animations',
    author: 'tr7zw',
    authorAvatar: 'https://cdn.modrinth.com/data/MPCX6s5C/icon.png',
    description: 'Adds missing third-person animations.',
    icon: 'https://cdn.modrinth.com/data/MPCX6s5C/icon.png',
    url: 'https://modrinth.com/mod/not-enough-animations'
  },
  'bobby': {
    displayName: 'Bobby',
    author: 'Johni0702',
    authorAvatar: 'https://cdn.modrinth.com/data/kWjL4OHb/icon.png',
    description: 'Allows for render distances greater than server distance.',
    icon: 'https://cdn.modrinth.com/data/kWjL4OHb/icon.png',
    url: 'https://modrinth.com/mod/bobby'
  },
  'distanthorizons': {
    displayName: 'Distant Horizons',
    author: 'James_Seibel',
    authorAvatar: 'https://cdn.modrinth.com/data/uCdwusMi/icon.png',
    description: 'Increases render distance with level of detail (LOD).',
    icon: 'https://cdn.modrinth.com/data/uCdwusMi/icon.png',
    url: 'https://modrinth.com/mod/distanthorizons'
  },
  'betterf3': {
    displayName: 'Better F3',
    author: 'cominixo',
    authorAvatar: 'https://cdn.modrinth.com/data/8ShHXOiD/icon.png',
    description: 'Customizable and colorful F3 debug HUD.',
    icon: 'https://cdn.modrinth.com/data/8ShHXOiD/icon.png',
    url: 'https://modrinth.com/mod/betterf3'
  },
  'shulkerboxtooltip': {
    displayName: 'Shulker Box Tooltip',
    author: 'MisterPeModder',
    authorAvatar: 'https://cdn.modrinth.com/data/2M01OIrb/icon.png',
    description: 'View contents of shulker boxes in your inventory.',
    icon: 'https://cdn.modrinth.com/data/2M01OIrb/icon.png',
    url: 'https://modrinth.com/mod/shulkerboxtooltip'
  },
  'freecam': {
    displayName: 'Freecam',
    author: 'Hashalite',
    authorAvatar: 'https://cdn.modrinth.com/data/OVuFYtVn/icon.png',
    description: 'A highly configurable freecam mod for Fabric.',
    icon: 'https://cdn.modrinth.com/data/OVuFYtVn/icon.png',
    url: 'https://modrinth.com/mod/freecam'
  },
  'litematica': {
    displayName: 'Litematica',
    author: 'masa',
    authorAvatar: 'https://cdn.modrinth.com/data/G1953dQ9/icon.png',
    description: 'Client-side schematic mod for modern Minecraft.',
    icon: 'https://cdn.modrinth.com/data/G1953dQ9/icon.png',
    url: 'https://modrinth.com/mod/litematica'
  },
  'minihud': {
    displayName: 'MiniHUD',
    author: 'masa',
    authorAvatar: 'https://cdn.modrinth.com/data/z59H2kR7/icon.png',
    description: 'A client-side mod that displays various info on the HUD.',
    icon: 'https://cdn.modrinth.com/data/z59H2kR7/icon.png',
    url: 'https://modrinth.com/mod/minihud'
  },
  'tweakeroo': {
    displayName: 'Tweakeroo',
    author: 'masa',
    authorAvatar: 'https://cdn.modrinth.com/data/3gV74M4q/icon.png',
    description: 'Various client-side tweaks and utilities.',
    icon: 'https://cdn.modrinth.com/data/3gV74M4q/icon.png',
    url: 'https://modrinth.com/mod/tweakeroo'
  },
  'fast-ip-ping': {
    displayName: 'Fast IP Ping',
    author: 'Fuzss',
    authorAvatar: 'https://cdn.modrinth.com/data/V04256vM/icon.png',
    description: 'Makes the server list ping much faster.',
    icon: 'https://cdn.modrinth.com/data/V04256vM/icon.png',
    url: 'https://modrinth.com/mod/fast-ip-ping'
  },
  'memoryleakfix': {
    displayName: 'Memory Leak Fix',
    author: 'FxMorin',
    authorAvatar: 'https://cdn.modrinth.com/data/NRjRBDE9/icon.png',
    description: 'Fixes multiple memory leaks in Minecraft client.',
    icon: 'https://cdn.modrinth.com/data/NRjRBDE9/icon.png',
    url: 'https://modrinth.com/mod/memoryleakfix'
  },
  'modernfix': {
    displayName: 'ModernFix',
    author: 'embeddedt',
    authorAvatar: 'https://cdn.modrinth.com/data/nmCjNsY6/icon.png',
    description: 'All-in-one performance and bugfix mod.',
    icon: 'https://cdn.modrinth.com/data/nmCjNsY6/icon.png',
    url: 'https://modrinth.com/mod/modernfix'
  },
  'krypton': {
    displayName: 'Krypton',
    author: 'Tux',
    authorAvatar: 'https://cdn.modrinth.com/data/fQEb0iWs/icon.png',
    description: 'Optimizes the Minecraft networking stack.',
    icon: 'https://cdn.modrinth.com/data/fQEb0iWs/icon.png',
    url: 'https://modrinth.com/mod/krypton'
  },
  'badoptimizations': {
    displayName: 'BadOptimizations',
    author: 'Someone-Else',
    authorAvatar: 'https://cdn.modrinth.com/data/IAnP4A4T/icon.png',
    description: 'Fixes Minecraft performance bugs.',
    icon: 'https://cdn.modrinth.com/data/IAnP4A4T/icon.png',
    url: 'https://modrinth.com/mod/badoptimizations'
  },
  'enhancedblockentities': {
    displayName: 'Enhanced Block Entities',
    author: 'FoundationGames',
    authorAvatar: 'https://cdn.modrinth.com/data/OVuFYtVn/icon.png',
    description: 'Improves rendering performance of block entities.',
    icon: 'https://cdn.modrinth.com/data/OVuFYtVn/icon.png',
    url: 'https://modrinth.com/mod/ebe'
  },
  'mousetweaks': {
    displayName: 'Mouse Tweaks',
    author: 'YaLTeR',
    authorAvatar: 'https://cdn.modrinth.com/data/a6hT5YlE/icon.png',
    description: 'Enhances inventory management with mouse shortcuts.',
    icon: 'https://cdn.modrinth.com/data/a6hT5YlE/icon.png',
    url: 'https://modrinth.com/mod/mouse-tweaks'
  },
  'controlling': {
    displayName: 'Controlling',
    author: 'Jaredlll08',
    authorAvatar: 'https://cdn.modrinth.com/data/xv9v8hg5/icon.png',
    description: 'Adds a search bar to keybindings.',
    icon: 'https://cdn.modrinth.com/data/xv9v8hg5/icon.png',
    url: 'https://modrinth.com/mod/controlling'
  },
  'clumps': {
    displayName: 'Clumps',
    author: 'Jaredlll08',
    authorAvatar: 'https://cdn.modrinth.com/data/Wnxd13zP/icon.png',
    description: 'Clumps XP orbs together to reduce lag.',
    icon: 'https://cdn.modrinth.com/data/Wnxd13zP/icon.png',
    url: 'https://modrinth.com/mod/clumps'
  },
  'zoomify': {
    displayName: 'Zoomify',
    author: 'isXander',
    authorAvatar: 'https://cdn.modrinth.com/data/w7ThoJFB/icon.png',
    description: 'A zoom mod with infinite customization.',
    icon: 'https://cdn.modrinth.com/data/w7ThoJFB/icon.png',
    url: 'https://modrinth.com/mod/zoomify'
  },
  'spark': {
    displayName: 'spark',
    author: 'lucko',
    authorAvatar: 'https://cdn.modrinth.com/data/l6YH9Als/icon.png',
    description: 'Performance profiling tool for Minecraft.',
    icon: 'https://cdn.modrinth.com/data/l6YH9Als/icon.png',
    url: 'https://modrinth.com/mod/spark'
  },
  'c2me-fabric': {
    displayName: 'C2ME',
    author: 'Ishland',
    authorAvatar: 'https://cdn.modrinth.com/data/VSNURh3q/icon.png',
    description: 'Concurrent chunk management engine for Fabric.',
    icon: 'https://cdn.modrinth.com/data/VSNURh3q/icon.png',
    url: 'https://modrinth.com/mod/c2me-fabric'
  }
};

// Shaders Catalog
const CURATED_SHADERS_CATALOG: Record<string, EnrichedContentMetadata> = {
  'bsl': {
    displayName: 'BSL Shaders',
    author: 'CaptTatsu',
    description: 'Bright, colorful, and distinct shading style with warm lighting.',
    icon: 'https://cdn.modrinth.com/data/Q1vvjJYV/2a611a3cb434fb52fb81fa5dace13c5d8b67e55d_96.webp',
    url: 'https://modrinth.com/shader/bsl-shaders'
  },
  'complementary': {
    displayName: 'Complementary Shaders - Reimagined',
    author: 'EminGT',
    description: 'Exceptional quality, detailed shadows, and incredible performance.',
    icon: 'https://cdn.modrinth.com/data/HVnmMxH1/79cb7c8123bbc54945305b2ebad6b8881efdf5f8_96.webp',
    url: 'https://modrinth.com/shader/complementary-reimagined'
  },
  'complementary-reimagined': {
    displayName: 'Complementary Shaders - Reimagined',
    author: 'EminGT',
    description: 'Exceptional quality, detailed shadows, and incredible performance.',
    icon: 'https://cdn.modrinth.com/data/HVnmMxH1/79cb7c8123bbc54945305b2ebad6b8881efdf5f8_96.webp',
    url: 'https://modrinth.com/shader/complementary-reimagined'
  },
  'complementary-unbound': {
    displayName: 'Complementary Shaders - Unbound',
    author: 'EminGT',
    description: 'Uncapped visual fidelity and realism for high-end setups.',
    icon: 'https://cdn.modrinth.com/data/R6NEzAwj/c85ce4049aac76360d2cd24fd9a7003de01ef312_96.webp',
    url: 'https://modrinth.com/shader/complementary-unbound'
  },
  'photon': {
    displayName: 'Photon Shaders',
    author: 'sixthsurge',
    description: 'Atmospheric, balanced lighting with physically-based rendering.',
    icon: 'https://cdn.modrinth.com/data/lLqFfGNs/39cb5f12e7dcc68d6cb666f225fcb2b801dd70fb_96.webp',
    url: 'https://modrinth.com/shader/photon-shader'
  },
  'solas': {
    displayName: 'Solas Shader',
    author: 'Septonious',
    description: 'Fancy volumetric clouds, aurora borealis, and vibrant biomes.',
    icon: 'https://cdn.modrinth.com/data/EpQFjzrQ/e3efc6ba7a63f9e1cf473a794d0224a6daf243c7_96.webp',
    url: 'https://modrinth.com/shader/solas-shader'
  },
  'bliss': {
    displayName: 'Bliss Shaders',
    author: 'Xonk',
    description: 'Subtle and dreamy shader focused on natural atmosphere.',
    icon: 'https://cdn.modrinth.com/data/ZvMtQlho/90145c971ea24387775108fc86c89bed9bd2c8f1_96.webp',
    url: 'https://modrinth.com/shader/bliss-shader'
  },
  'makeup': {
    displayName: 'MakeUp - Ultra Fast',
    author: 'KDcvXavier',
    description: 'High FPS shader pack tailored for low to mid-range graphics.',
    icon: 'https://cdn.modrinth.com/data/izsIPI7a/a08432baa86b8ffd58c08f4b3a001ef976ff764d_96.webp',
    url: 'https://modrinth.com/shader/makeup-ultra-fast-shader'
  },
  'rethinking-voxels': {
    displayName: 'Rethinking Voxels',
    author: 'gri5/3',
    description: 'Voxel-based raytraced colored lighting in vanilla Minecraft.',
    icon: 'https://cdn.modrinth.com/data/kmwfVOoi/fc89eadad417dd376b14c3b31e1a2b87acaca034_96.webp',
    url: 'https://modrinth.com/shader/rethinking-voxels'
  }
};

// Resource Packs Catalog
const CURATED_RESOURCE_PACKS_CATALOG: Record<string, EnrichedContentMetadata> = {
  'faithful': {
    displayName: 'Faithful 32x',
    author: 'FaithfulTeam',
    description: 'The legendary Minecraft high-res faithful resource pack.',
    icon: 'https://cdn.modrinth.com/data/V32/icon.png',
    url: 'https://modrinth.com/resourcepack/faithful-32x'
  },
  'bare-bones': {
    displayName: 'Bare Bones',
    author: 'RobotPantaloons',
    description: 'Brings the Minecraft world into the style of official trailers.',
    icon: 'https://cdn.modrinth.com/data/OSyB6pLu/icon.png',
    url: 'https://modrinth.com/resourcepack/bare-bones'
  },
  'stay-true': {
    displayName: 'Stay True',
    author: 'hothat',
    description: 'Visual remaster that stays true to default Minecraft.',
    icon: 'https://cdn.modrinth.com/data/c5p4A5f2/icon.png',
    url: 'https://modrinth.com/resourcepack/stay-true'
  },
  'fresh-animations': {
    displayName: 'Fresh Animations',
    author: 'FreshLX',
    description: 'Dynamic and expressive animations for vanilla mobs.',
    icon: 'https://cdn.modrinth.com/data/1IjD5062/icon.png',
    url: 'https://modrinth.com/resourcepack/fresh-animations'
  },
  'dramatic-skys': {
    displayName: 'Dramatic Skys',
    author: 'thebaum64',
    description: 'Breathtaking custom HD skies, clouds, and celestial bodies.',
    icon: 'https://cdn.modrinth.com/data/V6210k/icon.png',
    url: 'https://modrinth.com/resourcepack/dramatic-skys'
  },
  'xray-ultimate': {
    displayName: 'Xray Ultimate',
    author: 'FilmJerk',
    description: 'Highlights ores and resources underground.',
    icon: 'https://cdn.modrinth.com/data/50t0606L/icon.png',
    url: 'https://modrinth.com/resourcepack/xray-ultimate'
  }
};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.jar$|\.zip$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSlug(name: string): string {
  return normalizeName(name).replace(/\s+/g, '-');
}

/**
 * Resolves high-definition icon, author name, avatar, and description for a content item.
 * Searches curated dictionaries, local storage cache, and triggers background fetch if needed.
 */
export function resolveContentMetadata(
  name: string,
  filename?: string,
  existingIcon?: string,
  existingDescription?: string,
  existingAuthors?: string[],
  type: 'mod' | 'resourcepack' | 'shader' = 'mod'
): EnrichedContentMetadata {
  const norm = normalizeName(name);
  const slug = getSlug(name);
  const fileNorm = filename ? normalizeName(filename) : '';
  const fileSlug = filename ? getSlug(filename) : '';

  // 1. Check if item has a valid embedded base64 or remote URL
  const hasValidIcon = existingIcon && (existingIcon.startsWith('data:image') || existingIcon.startsWith('http'));

  // 2. Select appropriate catalog
  const catalog =
    type === 'shader'
      ? CURATED_SHADERS_CATALOG
      : type === 'resourcepack'
      ? CURATED_RESOURCE_PACKS_CATALOG
      : CURATED_MODS_CATALOG;

  // 3. Check catalog matches
  const match =
    catalog[slug] ||
    catalog[fileSlug] ||
    catalog[norm] ||
    catalog[fileNorm] ||
    Object.entries(catalog).find(([k]) => norm.includes(k) || fileNorm.includes(k))?.[1];

  // 4. Check persistent storage cache
  const pCache = getPersistentCache();
  const cached = pCache[slug] || pCache[fileSlug] || pCache[norm];

  const author =
    (existingAuthors && existingAuthors.length > 0 ? existingAuthors.join(', ') : null) ||
    match?.author ||
    cached?.author ||
    'Community';

  const description =
    match?.description ||
    cached?.description ||
    existingDescription ||
    (type === 'mod' ? 'Minecraft gameplay enhancement mod.' : type === 'shader' ? 'Visual lighting and shader pack.' : 'Minecraft resource texture pack.');

  const icon =
    (hasValidIcon ? existingIcon : null) ||
    match?.icon ||
    cached?.icon ||
    undefined;

  const authorAvatar =
    match?.authorAvatar ||
    cached?.authorAvatar ||
    match?.icon ||
    icon ||
    undefined;

  return {
    displayName: match?.displayName || name,
    icon,
    author,
    authorAvatar,
    description,
    url: match?.url || cached?.url
  };
}

/**
 * Background auto-fetch from Modrinth API for any mod that lacks an icon or description.
 * Stores hits in persistent localStorage cache and fires the onEnriched callback.
 */
const pendingQueries = new Set<string>();

export async function fetchMissingMetadataOnline(
  name: string,
  filename?: string,
  type: 'mod' | 'resourcepack' | 'shader' = 'mod',
  onEnriched?: (data: EnrichedContentMetadata) => void
): Promise<EnrichedContentMetadata | null> {
  const norm = normalizeName(name);
  const query = norm.split(' ')[0] || norm;
  if (!query || pendingQueries.has(query)) return null;

  // Check persistent cache first
  const pCache = getPersistentCache();
  if (pCache[norm]?.icon) {
    if (onEnriched) onEnriched(pCache[norm]);
    return pCache[norm];
  }

  pendingQueries.add(query);

  try {
    const projectType = type === 'shader' ? 'shader' : type === 'resourcepack' ? 'resourcepack' : 'mod';
    const res = await fetch(
      `https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&facets=[["project_type:${projectType}"]]&limit=1`,
      { headers: { 'User-Agent': 'GalaxyLauncher/1.0.4 (galaxy-launcher)' } }
    );

    if (res.ok) {
      const data = await res.json();
      if (data?.hits && data.hits.length > 0) {
        const hit = data.hits[0];
        const enriched: EnrichedContentMetadata = {
          displayName: hit.title || name,
          icon: hit.icon_url || undefined,
          author: hit.author || 'Mod Author',
          authorAvatar: hit.icon_url || undefined,
          description: hit.description || undefined,
          url: `https://modrinth.com/${projectType}/${hit.slug || hit.project_id}`
        };

        setPersistentCache(norm, enriched);
        if (filename) setPersistentCache(normalizeName(filename), enriched);

        if (onEnriched) onEnriched(enriched);
        return enriched;
      }
    }
  } catch (err) {
    // network or offline, silent fallback
  } finally {
    pendingQueries.delete(query);
  }

  return null;
}
