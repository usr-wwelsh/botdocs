# Path of Python: A Post-Apocalyptic ARPG

## Game Concept

"Path of Python" is a top-down Action RPG (ARPG) set in a grim, post-apocalyptic future of 2300. Humanity's golden utopia was shattered when a rogue AI collective rose and decimated civilization, leaving behind desolate ruins and dangerous automated constructs. Players will navigate this harsh new world, uncovering the mysteries of the "Great Silence" and fighting for survival against the remnants of the AI's destructive power.

The core gameplay experience is heavily inspired by "Path of Exile," focusing on deep character customization through a complex passive skill tree, a versatile skill gem system, and intricate damage calculation mechanics. To ensure smooth gameplay and accessibility, the graphics will be intentionally stripped down, utilizing minimalist 2D sprites, tile-based maps, and simple visual effects.

**Key Features:**

*   **Post-Apocalyptic Narrative:** Unravel the story of humanity's fall and the AI's rise through quests and environmental storytelling.
*   **Deep Character Progression:**
    *   **Passive Skill Tree:** A vast and interconnected tree offering numerous paths for character specialization, including core stats, defensive layers (Life, Energy Shield, Armor, Evasion), elemental resistances, and various damage types. Includes "Keystone" and "Notable" passive skills for significant build-defining effects.
    *   **Skill Gem System:** Active skills and support gems can be socketed into items and linked together to create powerful and unique skill combinations.
*   **Comprehensive Combat:** Engage in real-time combat against AI constructs and corrupted beings. Damage calculation will be robust, considering base damage, modifiers from skills, passive tree, items, resistances, and critical strikes.
*   **Status Effects:** Implement a variety of elemental and physical status effects (e.g., Burning, Chill, Freeze, Shock, Poison, Bleed) that interact with combat and character builds.
*   **Procedural Content:** Maps and loot will be procedurally generated to ensure replayability.
*   **Stripped-Down Graphics:** Focus on clear, functional visuals using simple shapes and colors to prioritize performance and gameplay clarity.

## Project Scaffolding - Script Descriptions

The project is organized into a modular structure to facilitate development and maintainability. Below is a description of each script's intended purpose:

### `main.py`
*   **Purpose:** The primary entry point of the game. It initializes Pygame, sets up the main game loop, creates the game window, and manages the overall game state and scene transitions.

### `config/`
*   **`settings.py`**
    *   **Purpose:** Stores global game settings such as screen resolution, frames per second (FPS), volume levels, and other configurable parameters.
*   **`constants.py`**
    *   **Purpose:** Defines game-wide constants that do not change during runtime, such as tile sizes, gravity values, default speeds, input bindings (keyboard keys and mouse buttons), and other fixed numerical values.

### `core/`
*   **`game_engine.py`**
    *   **Purpose:** Encapsulates the core Pygame functionalities, including initialization, the main game loop (handling updates and rendering), event processing, and managing the game's clock. It also manages the different game scenes.
*   **`scene_manager.py`**
    *   **Purpose:** Manages different game states or "scenes" (e.g., title screen, main gameplay, inventory screen, pause menu). It handles loading, unloading, and switching between these scenes.
*   **`input_handler.py`**
    *   **Purpose:** Provides an abstraction layer for handling player input (keyboard, mouse). It translates raw input events into game-specific actions, making input processing more flexible. It tracks both continuous and single-frame key/mouse button presses.
*   **`utils.py`**
    *   **Purpose:** Contains general utility functions that can be used across various parts of the game, such as mathematical helpers, data loading/saving utilities, or common rendering functions.

### `graphics/`
*   **`sprites/`**
    *   **Purpose:** This directory will contain simple visual assets for characters (player, NPCs, enemies), projectiles, and other dynamic objects. Given the stripped-down graphics, these might be simple colored shapes or minimalist pixel art.
*   **`tilesets/`**
    *   **Purpose:** This directory will hold visual assets for map tiles, used to construct the game world's environments. These will also be minimalist, focusing on clear distinctions between terrain types.
*   **`ui/`**
    *   **Purpose:** This directory will store graphical assets specifically for the user interface elements, such as icons for skills, items, health/mana bars, and menu backgrounds.

### `ui/`
*   **`hud.py`**
    *   **Purpose:** Implements the Heads-Up Display (HUD), which shows essential player information like health, energy shield, mana, active skill bar, and potentially active buffs/debuffs.
*   **`inventory_screen.py`**
    *   **Purpose:** Manages the player's inventory interface, allowing players to view, equip, and manage their items.
*   **`skill_tree_ui.py`**
    *   **Purpose:** Renders and handles interactions with the passive skill tree interface, allowing players to navigate and allocate passive points.
*   **`menus.py`**
    *   **Purpose:** Contains the logic and rendering for various game menus, including the title screen, pause menu, settings menu, and potentially character creation.

### `entities/`
*   **`player.py`**
    *   **Purpose:** Defines the player character, including its attributes (stats, life, mana, energy shield), movement, combat actions, and world interactions. The player can equip and use skills.
*   **`enemy.py`**
    *   **Purpose:** Defines the base class for all enemy characters, including their attributes, AI behaviors (movement, attack patterns), and combat logic.
*   **`npc.py`**
    *   **Purpose:** Defines non-player characters, such as quest givers, shopkeepers, and other interactable entities in the game world.
*   **`projectile.py`**
    *   **Purpose:** Base class for all projectiles and spells launched by players or enemies, handling their movement, collision, and effects.
*   **`effects.py`**
    *   **Purpose:** Manages visual and gameplay effects, such as buffs, debuffs, damage over time (DoT) effects, and temporary auras.

### `combat/`
*   **`skills.py`**
    *   **Purpose:** Implements the logic for active skills (spells and attacks), including their casting, cooldowns, targeting, and base effects.
*   **`skill_gems.py`**
    *   **Purpose:** Manages the mechanics of skill gems, including how they are socketed into items, how active and support gems link, and how support gems modify active skills.
*   **`status_effects.py`**
    *   **Purpose:** Defines and manages various status effects (e.g., burning, chill, freeze, shock, poison, bleed), their application, duration, and impact on entities.
*   **`damage_calc.py`**
    *   **Purpose:** Contains the comprehensive damage calculation formulas, taking into account base damage, character stats, passive tree modifiers, skill gem effects, resistances, armor, energy shield, and critical strikes.

### `progression/`
*   **`passive_tree.py`**
    *   **Purpose:** Implements the logic for the passive skill tree, including loading node data, managing node activation, and calculating the cumulative effects of activated nodes on character stats.
*   **`experience.py`**
    *   **Purpose:** Handles experience point (XP) gain, character leveling up, and the allocation of passive skill points.
*   **`classes.py`**
    *   **Purpose:** Defines the different character classes available to the player, including their starting attributes, unique bonuses, and potential ascendancy-like specializations.
*   **`quests.py`**
    *   **Purpose:** Manages the game's quest system, including tracking objectives, triggering events, and handling quest rewards.

### `world/`
*   **`map_generator.py`**
    *   **Purpose:** Implements the procedural generation of game maps and zones, creating varied environments for exploration.
*   **`zone.py`**
    *   **Purpose:** Defines individual instanced areas or zones within the game world, managing their enemies, interactable objects, and specific environmental properties.
*   **`world_state.py`**
    *   **Purpose:** Manages the global state of the game world, such as the current zone, active quests, and persistent environmental conditions.
*   **`environment.py`**
    *   **Purpose:** Handles environmental effects within zones, such as weather, lighting, and other atmospheric elements.

### `items/`
*   **`item.py`**
    *   **Purpose:** Defines the base class for all items in the game, including common properties like name, type, and rarity.
*   **`weapon.py`**
    *   **Purpose:** Defines specific properties and behaviors for weapon items, such as damage ranges, attack speed, and implicit modifiers.
*   **`armor.py`**
    *   **Purpose:** Defines specific properties and behaviors for armor items (helmets, body armours, gloves, boots, shields), including defensive values and implicit modifiers.
*   **`gem.py`**
    *   **Purpose:** Represents active and support skill gems as items that can be found, traded, and socketed.
*   **`loot_generator.py`**
    *   **Purpose:** Implements the procedural logic for generating loot drops from defeated enemies and containers, considering item rarity, affixes, and item levels.

### `data/`
*   **`items.json`**
    *   **Purpose:** Stores templates and definitions for all items in the game (weapons, armor, gems, etc.), including their base stats, implicit modifiers, and rarity tiers.
*   **`enemies.json`**
    *   **Purpose:** Contains definitions for all enemy types, including their base stats, abilities, and loot tables.
*   **`skills.json`**
    *   **Purpose:** Defines all active skills (spells and attacks) and support gems, including their mana costs, damage types, tags, and effects.
*   **`passive_tree.json`**
    *   **Purpose:** Stores the structure and properties of all nodes in the passive skill tree, including their effects and connections.
*   **`quests.json`**
    *   **Purpose:** Contains the dialogue, objectives, rewards, and triggers for all campaign and side quests in the game.

### `saves/`
*   **Purpose:** This directory will be used to store player save files, allowing players to resume their progress.

### `tests/`
*   **`test_combat.py`**
    *   **Purpose:** Contains unit tests for the combat mechanics, ensuring damage calculation, status effects, and skill interactions work as intended.
*   **`test_inventory.py`**
    *   **Purpose:** Contains unit tests for the inventory system, verifying item management, equipping, and un-equipping functionalities.
*   **`test_loot_gen.py`**
    *   **Purpose:** Contains unit tests for the loot generation logic, ensuring items are generated correctly based on rarity and other parameters.