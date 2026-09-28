# Complete Understanding of the Game Code

## Project Structure

The project is organized as follows:

-   `combat/`: Contains modules related to combat logic, such as damage calculation and enemy creation.
-   `config/`: Contains configuration files.
-   `core/`: Contains core game logic, including boss scenes and dungeons.
-   `data/`: Contains game data, such as classes, dialogue, dungeon templates, enemy data, items, quests, skills, and tileset mappings.
-   `entities/`: Contains entity definitions, such as player, NPCs, and projectiles.
-   `graphics/`: Contains graphics resources, such as tilesets, character sprites, and UI elements.
-   `items/`: Contains item definitions.
-   `progression/`: Contains code related to player progression and leveling.
-   `saves/`: Contains save game data.
-   `tests/`: Contains unit tests.
-   `ui/`: Contains code for the user interface.
-   `utility/`: Contains utility functions.
-   `world/`: Contains code for world generation and management.

## Main Components

-   **Tilemaps:** The game uses tilemaps to represent the game world. Tilemaps are composed of tiles from tilesets.
-   **Tilesets:** Tilesets are collections of tiles used to create tilemaps.
-   **Quests:** The game features a quest system that guides the player through the game world.
-   **NPCs:** Non-player characters populate the game world and provide quests, dialogue, and other interactions.
-   **Dialogue:** The game uses a dialogue system to facilitate interactions between the player and NPCs.
-   **Player Classes:** The player can choose from different classes, each with unique abilities and playstyles.
-   **Level Up System:** The player can level up their character to improve their stats and unlock new abilities.
-   **Combat System:** Handles interactions between the player, enemies, and projectiles, including damage calculation, status effects, and enemy behaviors.
-   **Enemy Types:** Various enemies with different stats, attack patterns, and special abilities.

## Tilemap Drawing

The `BaseGameplayScene` class handles the loading and drawing of tilemaps. Here's a breakdown of the process:

1.  **Initialization:**
    -   The `__init__` method initializes the scene, including loading the `MusicManager`, `BossSystemManager`, and `EnemyFactory`.
    -   It also initializes the camera settings, tile size, and various sprite groups (enemies, projectiles, portals, etc.).
    -   The `_load_tile_images()` method is called to load the tile images.
    -   The `load_enemies()` and `load_decorations()` methods are called to load enemies and decorations from the dungeon data.
    -   The `post_init()` method is called to perform tasks that require the full scene to be set up, such as spawning the boss portal.

2.  **Loading Tile Images (`_load_tile_images()`):**
    -   This method loads tile images based on the `tileset_name`.
    -   It first tries to load tile images from `data/zone_data.json`.
    -   If the tileset is not found there, it loads tile images from a separate JSON file in the `data/tilesets/` directory (e.g., `data/tilesets/default_tileset.json`).
    -   The path to each tile image is stored in the tileset JSON file.
    -   If a tile image is not found, a magenta placeholder is used.

3.  **Drawing the Map (`draw()`):**
    -   This method draws the tilemap.
    -   It iterates through the `tile_map` (which is a 2D array representing the map).
    -   For each tile, it gets the tile type from the `tile_map` and retrieves the corresponding tile image from the `tile_images` dictionary.
    -   The tile image is then drawn on the screen at the appropriate coordinates, taking into account the camera position and zoom level.
    -   The code calculates the visible tile range based on the camera position and screen dimensions to optimize drawing.
    -   If a tile image is not found, a magenta placeholder is used.

4.  **Camera and Zoom:**
    -   The camera position and zoom level are used to determine which tiles are visible on the screen and how they are scaled.
    -   The camera's `x` and `y` coordinates are used to offset the tile positions, and the `zoom_level` is used to scale the tile images.
    -   The `update()` method calculates the camera position based on the player's position and clamps it to the map boundaries.

5.  **Fog of War:**
    -   If the `is_dark` flag is set to `True`, the code implements a fog of war effect.
    -   It calculates the distance between the player and each tile, and if the distance is greater than a certain radius (`FOG_RADIUS`), the tile is covered with a black rectangle.

6.  **Important Methods Called:**
    -   `MusicManager.play_random_song()`: Plays a random song in the scene.
    -   `BossSystemManager.attempt_spawn_portal()`: Attempts to spawn a boss portal in the scene.
    -   `EnemyFactory.create_enemy()`: Creates an enemy based on the enemy data.
    -   `Player.update()`: Updates the player's state.
    -   `HUD.update()`: Updates the HUD.
    -   `Enemy.update()`: Updates the enemies' states.
    -   `Projectile.update()`: Updates the projectiles' states.
    -   `NPC.update()`: Updates the NPCs' states.
    -   `DialogueManager.start_dialogue()`: Starts a dialogue with an NPC.
    -   `DialogueManager.draw()`: Draws the dialogue on the screen.

## Tilesets

Tilesets are collections of tiles used to create tilemaps. Each tileset is defined in a JSON file in the `data/tilesets/` directory. The tileset JSON files map tile names (e.g., "floor", "wall") to image paths. For example, the `default_tileset.json` file contains the following mapping:

```json
{
  "floor": "graphics/dc-dngn/floor/marble_floor1.png",
  "wall": "graphics/dc-dngn/wall/dngn_green_crystal_wall.png",
  "portal": "graphics/title.png",
  "decoration": "graphics/dc-dngn/dngn_sparkling_fountain.png",
  "unknown": "graphics/title.png"
}
```

The `_load_tile_images()` method in `BaseGameplayScene` loads the tileset data from these JSON files and stores the tile images in the `tile_images` dictionary.

## Quest System Components

The quest system in the game is composed of several interconnected components, including quest definitions, scene implementations, dialogue trees, and objective completion mechanics.

### Quest Structure (`data/quests.json`)

Quests are defined in `data/quests.json` as a JSON array of quest objects. Each quest object has the following attributes:

*   `id` (string): A unique identifier for the quest (e.g., "quest_001").
*   `name` (string): The display name of the quest (e.g., "Debt Spiral").
*   `description` (string): A brief description of the quest's premise.
*   `objectives` (array of objects): A list of tasks the player needs to complete for the quest. Each objective has:
    *   `description` (string): A description of the objective (e.g., "Kill 3 Tithing Acolytes").
    *   `completed` (boolean): A flag indicating whether the objective has been completed (initially `false`).
*   `rewards` (object): An object detailing the rewards upon quest completion, which can include:
    *   `scrap` (integer): In-game currency.
    *   `exp` (integer): Experience points.
    *   `item` (string): The ID of an item received as a reward.
*   `is_completed` (boolean): A flag indicating if the entire quest is completed (initially `false`).
*   `is_unlocked` (boolean): A flag indicating if the quest is available to the player (initially `true` for starting quests, `false` otherwise).
*   `tilemap_scene_name` (string): The name of the tilemap scene associated with the quest (e.g., "quest_001_dungeon").

### Quest Scene Implementation (`core/quest_001_scene.py`)

The `Quest001Scene` class (and presumably other quest-specific scenes) extends `BaseGameplayScene` and handles the specific logic for a quest's environment. Key aspects include:

*   **Initialization (`__init__`)**:
    *   Inherits core functionality from `BaseGameplayScene`.
    *   Loads map dimensions and tile data from `dungeon_data`.
    *   Initializes scene-specific sprite groups for `npcs`, `effects`, and `items`.
    *   Sets the scene's `name` (e.g., "Quest001Scene").
    *   Dynamically loads NPCs, items, and decorations based on the `dungeon_data` provided to the scene.
    *   Determines the player's spawn point, prioritizing a 'player_spawn' tile or defaulting to the first 'floor' tile found.
*   **Entity Loading (`load_npcs`, `load_items`)**:
    *   `load_npcs`: Populates the scene with `NPC` objects, positioning them (e.g., centered in the room) and associating them with `dialogue_id`s for interaction.
    *   `load_items`: Adds `Item` objects to the scene at specified coordinates.
*   **Scene Management (`enter`, `exit`)**:
    *   `enter`: Sets the game's active player, HUD, and current map. It combines all relevant sprite groups (player, enemies, projectiles, portals, friendly_entities, npcs, items, effects) into `game.all_sprites` for rendering and updating.
    *   `exit`: Logs the scene exit.
*   **Interaction Handling (`handle_event`)**:
    *   Extends `BaseGameplayScene`'s event handling.
    *   Detects player interaction (e.g., pressing `KEY_INTERACT` or left-clicking) with nearby NPCs.
    *   Triggers the `npc_sprite.interact(self.player)` method, which initiates dialogue.
*   **Update and Drawing (`update`, `draw`)**:
    *   `update`: Calls the base class update, then updates scene-specific `npcs` and `effects`. It also handles player-item collisions, adding collected items to the player's inventory.
    *   `draw`: Calls the base class draw, then renders scene-specific decorations, NPCs, items, and effects, applying camera and zoom transformations.

### Dialogue Integration (`data/dialogue.json` and `data/post_quest_dialogue.json`)

Dialogue is a core component for NPC interactions and quest progression.

*   **Structure**: Both `dialogue.json` and `post_quest_dialogue.json` contain nested JSON objects representing dialogue trees. Each dialogue tree has a `start_node` and a collection of `nodes`.
    *   Each `node` contains `text` (the dialogue spoken by the NPC) and an array of `options` (player choices).
    *   Each `option` specifies `text` for the player's choice and a `next_node` to transition to.
*   **NPC Interaction**: NPCs are linked to specific dialogue trees via their `dialogue_id`. When the player interacts with an NPC, the game's `DialogueManager` (or similar system) uses this ID to load and present the appropriate dialogue flow.
*   **Quest Triggering**: Dialogue options can include a `triggers_quest` field, which, when selected, initiates a new quest by its `id` (e.g., `"triggers_quest": "quest_002_first_contact"`). This allows narrative choices to directly unlock new content.
*   **Post-Quest Content**: `post_quest_dialogue.json` specifically handles dialogues that occur after certain quests are completed, providing narrative follow-up, revealing lore, and often setting up subsequent quests or major plot points. These dialogues often reflect the consequences of the player's previous actions.

### Objective Completion Mechanics

Objective completion is primarily driven by player choices within dialogue and actions within quest scenes.

*   **Dialogue-Based Completion**: Many dialogue options include a `completes_objective` field. This object specifies the `type` of objective (e.g., "download", "save", "extract", "bypass", "retrieve", "burn", "unlock", "accept", "defend", "stabilize", "endure", "witness") and the `target` of that objective (e.g., "Profit Engine's weakness", "Bob's friend", "AI core", "biometric locks", "ledger_of_sins", "cargo manifests", "Feast Hall", "Neural Cathedral", "Broadcast Tower", "Final Sanctum", "your vitals", "the interface ritual (your skin glitches)", "prisoner revelation", "at least 5 prisoners"). When a player selects such an option, the corresponding quest objective is marked as complete.
*   **Scene-Based Completion**: While not explicitly detailed in the provided `quest_001_scene.py` for objective completion beyond item collection, it's implied that actions within the quest scenes (e.g., killing specific enemies, reaching certain locations, interacting with objects) would also trigger objective completion, likely through game logic that updates the quest state. For instance, the `Quest001Scene` handles player-item collisions, which could be tied to "collect item" objectives.
*   **Quest Unlocking**: The `completes_objective` with `type: "unlock"` is crucial for sequential quest progression, making new quest locations or major plot points available.

### Post-Quest Consequences

The `post_quest_dialogue.json` file vividly illustrates the narrative consequences of the player's actions, particularly concerning the "Profit Engine" and the player's unique role.

*   **Escalating Threat**: Dialogues from Bob, Alice, and Charlie after major quests (e.g., `post_quest_5`, `post_quest_6`, `post_quest_7`, `post_quest_8`, `post_quest_9`) describe the Engine's increasing corruption of SpawnTown, its attempts to "optimize" or "assimilate" the population, and its focus on the player as a "Sacrificial Archetype" or "template."
*   **Player's Identity**: The dialogues frequently challenge the player's identity, revealing their genetic connection to the Engine's origins and suggesting they are a "buffer solution," a "glitch," or even the "backdoor" to the system. This adds a deep, existential layer to the consequences.
*   **New Objectives/Locations**: The post-quest dialogues consistently lead to new, more critical objectives and unlock new dangerous locations (e.g., Feast Hall, Neural Cathedral, Data Maw, Broadcast Tower, Final Sanctum), pushing the narrative towards a climactic confrontation with the Profit Engine.
*   **Moral Choices**: Towards the end of the quest line (e.g., `alice_dialogue_post_quest_9`, `charlie_dialogue_post_quest_9`), the dialogues present the player with ultimate choices regarding the Engine's fate: rewrite, crash, or merge, each with distinct, far-reaching consequences for the world and the player's own existence.

## Player Classes and Level Up System

### Player Classes (`data/classes.json`)

The game offers several distinct player classes, each with unique starting skills, descriptions, and base statistics. These classes are defined in `data/classes.json`.

*   **Stalker**:
    *   **Skills**: `cleave`, `cyclone`
    *   **Description**: "A master of close combat, dealing devastating blows."
    *   **Base Sprite**: `graphics/player/base/vampire_m.png`
    *   **Stats**: High `base_strength` and `base_dexterity`, moderate `max_life`, `max_energy_shield`, and `max_mana`.
*   **Technomancer**:
    *   **Skills**: `arc`, `ice_nova`
    *   **Description**: "Wields arcane energies to unleash powerful spells."
    *   **Base Sprite**: `graphics/player/base/merfolk_f.png`
    *   **Stats**: High `base_intelligence`, moderate `max_life`, `max_energy_shield`, and `max_mana`.
*   **Hordemonger**:
    *   **Skills**: `summon_spiders`, `summon_skeleton`
    *   **Description**: "Commands legions of undead and arachnid minions."
    *   **Base Sprite**: `graphics/player/base/demonspawn_black_m.png`
    *   **Stats**: High `base_vitality`, moderate `max_life`, `max_energy_shield`, and `max_mana`.

Each class has a set of `base_stats` including `base_strength`, `base_dexterity`, `base_intelligence`, `base_vitality`, `max_life`, `max_energy_shield`, and `max_mana`.

### Level Up System (`ui/level_up_screen.py` and `progression/paste_tree_manager.py`)

The player's progression is managed through a level-up system and a "Paste Tree" system.

#### Level Up Screen (`ui/level_up_screen.py`)

The `LevelUpScreen` is a UI element where players can allocate "Enhancement Points" (referred to as `level_up_points`) gained from leveling up.

*   **Enhancement Points**: These points are calculated as `player.level - player.spent_level_points`.
*   **Stat Allocation**: Players can increase the following stats:
    *   **Health (`max_life`)**: Increases by 200 per point.
    *   **Mana (`max_mana`)**: Increases by 200 per point.
    *   **Energy Shield (`max_energy_shield`)**: Increases by 150 per point.
    *   **Damage (`damage`)**: Increases `base_damage` by 10. Additionally, it increases the bonus damage of all currently unlocked skills (e.g., `arc`, `cleave`, `cyclone`, `ice_nova`, `summon_skeleton`, `summon_spiders`) by a specific amount (10 for direct damage skills, 20 for summon damage).
*   **UI Elements**: The screen displays:
    *   A "Level Up: System Enhancement" title with a glitch effect.
    *   "Enhancement Points Available" count.
    *   Buttons for each stat (`Health`, `Mana`, `Energy Shield`, `Damage`, and a special "????", which increases all stats).
    *   Visual representations of current stats through bar graphs, a radar chart, and a scatter plot.
    *   Skill-specific damage values are displayed next to the "Damage" button if the player has those skills unlocked.
*   **Interaction**: Players can left-click to allocate one point or right-click to continuously allocate points to a stat. The special "???? " button allows allocating 1 or 10 points at once to all stats.

#### Paste Tree System (`ui/paste_tree_screen.py` and `progression/paste_tree_manager.py`)

The "Paste Tree" system provides an additional layer of progression, allowing players to acquire special "nodes" using "Profit Paste" currency.

*   **Paste Tree Data**: Defined in `data/paste_trees.json`, these trees are class-specific (e.g., "stalker", "technomancer", "hordemonger"). Each tree contains a collection of `nodes`.
*   **Nodes**: Each node has an `id`, `name`, and `description`.
*   **Acquisition**: Players can acquire nodes by spending "Profit Paste" (costing 50,000 paste per node).
*   **`PasteTreeManager`**: The `progression/paste_tree_manager.py` module (initialized in `PasteTreeScreen`) handles the logic for acquiring nodes, which likely applies the associated benefits to the player (though the specific effects of acquiring a node are not detailed in `ui/paste_tree_screen.py`).
*   **UI Elements**: The `PasteTreeScreen` displays:
    *   A central "Paste Tree" with interconnected nodes.
    *   Nodes are colored based on their acquisition status (green for acquired, grey for available, darker grey for unavailable).
    *   The currently selected node is highlighted with a pulsing effect.
    *   Information about the selected node (name and a glitchy description).
    *   The player's current "Profit Paste" count.
*   **Interaction**: Players can navigate through nodes using arrow keys and acquire the selected node by pressing `RETURN`.

## Combat System

The combat system involves interactions between the player, enemies, and projectiles, incorporating various attack types, status effects, and enemy behaviors.

### Core Combat Logic (`entities/enemy.py`)

The `Enemy` class in `entities/enemy.py` is central to combat, defining how enemies behave, take damage, and interact with the player and other entities.

*   **Attributes**: Enemies have `health`, `damage` (melee), `speed`, `attack_range` (for ranged attacks), `attack_cooldown`, `projectile_sprite_path`, and `ranged_attack_pattern`. They also have an `xp_value` and can drop `paste` upon death.
*   **Damage Taken (`take_damage`)**:
    *   Reduces `current_life` by the `amount`.
    *   Generates `DamageText` pop-ups to visualize damage.
    *   If `reflects_damage` is true, a percentage of damage is reflected back to the player.
    *   Upon death (`current_life <= 0`), the enemy awards experience to the player (doubled if the enemy has modifiers), updates quest progress, drops paste, and is removed from the game.
    *   Can spread `Necrotic Plague` to nearby enemies upon death if the player has the corresponding skill active.
*   **Melee Attacks**:
    *   Enemies have a `melee_range` (default `TILE_SIZE * 1.2`) and `melee_cooldown` (1000ms).
    *   If the player (or a friendly minion) is within melee range and the cooldown is met, the enemy deals its `damage` to the target.
*   **Ranged Attacks (`_perform_ranged_attack`)**:
    *   Enemies with an `attack_range` and `projectile_sprite_path` can perform ranged attacks.
    *   **Attack Patterns**:
        *   `"single"`: Shoots one projectile directly at the target.
        *   `"spread"`: Shoots multiple projectiles in a cone towards the target.
        *   `"burst"`: Shoots a rapid succession of projectiles (e.g., 3 projectiles with `burst_delay`).
        *   `"circle"`: Shoots projectiles in a full circle around the enemy.
        *   `"spiral"`: Shoots projectiles in a spiral pattern.
    *   Projectiles are added to the `game.current_scene.projectiles` group.
    *   Some projectiles can apply "Corrupted Blood" if the enemy has the corresponding modifier.
*   **Movement**: Enemies move towards their target (player or friendly minion) if they are outside melee range, respecting tile collisions.
*   **Targeting**: Enemies prioritize attacking friendly minions (Skeletons, Spiders) within a `targeting_range` before targeting the player.

### Status Effects (`entities/enemy.py`)

Enemies can be affected by various status effects, which modify their behavior or apply damage over time.

*   **Ignited**: Deals damage over time. Applied via `apply_ignite()`.
*   **Slowed**: Reduces movement speed. Applied via `apply_slow()`.
*   **Poisoned**: Deals damage over time. Applied via `apply_poison()`.
*   **Hasted**: Increases movement speed and attack speed. Applied via modifiers.
*   **Frenzied**: Increases damage and attack speed. Applied via modifiers.
*   **Corrupted Blood**: Stacks up to `max_corrupted_blood_stacks` (10), dealing damage per tick based on stacks. Applied by certain projectiles.
*   **Entropic Decay**: Stacks, dealing percentage-based damage over time. Applied by a `source_id`.
*   **Hexproof**: Grants immunity to certain debuffs (e.g., ignite, slow, poison, entropic decay). Applied via modifiers.
*   **Reflects Damage**: Reflects a percentage of incoming damage back to the attacker. Applied via modifiers.
*   **Necrotic Plague**: A special debuff that spreads to nearby enemies upon the afflicted enemy's death. Applied by the player's `necrotic_plague_state`.

### Enemy Modifiers (`entities/enemy.py`)

Enemies can randomly spawn with modifiers (10% chance, 1-3 modifiers) that significantly alter their stats and abilities.

*   `"2x Speed"`: Doubles speed, halves attack cooldown.
*   `"2x Health"`: Doubles health.
*   `"1.5x Damage"`: Increases damage by 50%.
*   `"More Projectiles"`: Increases burst projectile count by 2.
*   `"Piercing"`: Slightly increases damage.
*   `"Regenerating"`: Slightly increases health.
*   `"Armored"`: Increases health.
*   `"Hasted"`: Applies the Hasted status effect.
*   `"Frenzied"`: Applies the Frenzied status effect.
*   `"Corrupted Blood"`: Projectiles inflict Corrupted Blood.
*   `"Hexproof"`: Grants immunity to certain debuffs.
*   `"Reflects Damage"`: Reflects a percentage of incoming damage.

## Enemy Types (`data/enemy_data.json`)

The `data/enemy_data.json` file defines a wide variety of enemies, each with unique characteristics. This includes common enemies, unique bosses, and specialized entities.

Each enemy entry includes:
*   `name`: Display name of the enemy.
*   `health`: Base health points.
*   `damage`: Base melee damage.
*   `speed`: Movement speed.
*   `sprite_path`: Path to the enemy's visual sprite.
*   `attack_range`: Range for ranged attacks (0 for melee-only).
*   `attack_cooldown`: Time between attacks in milliseconds.
*   `projectile_sprite_path`: Path to the projectile sprite for ranged attacks (null if melee-only).
*   `ranged_attack_pattern`: Type of ranged attack (e.g., "single", "spread", "burst", "circle", "spiral").
*   `xp_value`: Experience points awarded upon defeat.
*   Optional attributes for specific enemies:
    *   `spawn_on_cooldown`: Boolean, if the enemy spawns other enemies.
    *   `spawn_cooldown`: Time between spawns in milliseconds.
    *   `enemies_to_spawn`: List of enemy IDs to spawn.
    *   `max_spawned_enemies`: Maximum number of minions this enemy can have active.
    *   `scale_factor`: Visual scaling for larger enemies.

Examples of enemy types:
*   **Quest/Lore-Specific Enemies**:
    *   `tithing_acolyte`: High speed, low damage, but with a very fast ranged attack.
    *   `profit_tracker`: Very high speed, low damage, fast ranged attack.
    *   `profit_scribe`: High health, moderate damage, very fast burst ranged attack.
    *   `lead_butcher`: Very high health and damage, spawns `profit_tracker` minions.
    *   `prototype_vat`: Immobile, very high health, low damage, circle ranged attack.
    *   `vault_bot`, `vault_bot2`, `vault_bot3`, `vault_bot4`, `xp_bot`: Specialized bots, some immobile, with varying attack patterns and high XP values.
    *   `firewall`: Very high health, high damage, fast movement, burst ranged attack.
    *   `high_comptroller`: Extremely high health, high damage, spawns `firewall` minions.
    *   `choir_disruptor`: Very high health and damage, spawns `guard` minions.
    *   `guard`: High health and damage.

## Skills

The game features a variety of active skills that players can use, each with unique mechanics, visual effects, and potential passive interactions. Skills generally have a mana cost and a cooldown.

### Arc Skill (`entities/arc_skill.py`)

*   **Description**: A chain lightning spell that strikes multiple enemies.
*   **Mechanics**:
    *   Fires initial projectiles from the player to a few nearby enemies.
    *   Upon hitting an enemy, it can chain to other nearby, undamage enemies within a `chain_range`.
    *   Damage is calculated based on `base_damage`, player level, and a random variation.
    *   Has a chance to stun hit enemies.
*   **Mana Cost**: Loaded from `data/skills.json` (default 15).
*   **Cooldown**: Loaded from `data/skills.json` (default 0.7 seconds).
*   **Passive Interaction**:
    *   **Arc Singularity**: If the player has this passive, it increases the effective chain range and damage of Arc.
*   **Visuals**: Draws jagged lightning lines between the player/hit enemies and targets, with a glow effect.

### Cleave Skill (`entities/cleave_skill.py`)

*   **Description**: A wide, sweeping melee attack that damages enemies in an arc.
*   **Mechanics**:
    *   Damages all enemies within a defined `attack_range` and `arc_angle` in front of the player.
    *   Damage is based on `base_damage` (min/max) and scales with player's `cleave_damage_multiplier`.
*   **Mana Cost**: 7.
*   **Cooldown**: 0 (no cooldown).
*   **Passive Interaction**:
    *   **Cleave Reality**: After a certain number of hits (`reality_hits_required`), this passive activates, causing the next Cleave to deal significantly increased damage in a larger cone and apply a strong slow effect to hit enemies.
*   **Visuals**: Creates a layered, fiery arc effect around the player, with a "whoosh" and a central flash. Cleave Reality has a distinct blue/purple visual effect.

### Cyclone Skill (`entities/cyclone_skill.py`)

*   **Description**: The player spins rapidly, hitting all enemies in a circle repeatedly while draining mana.
*   **Mechanics**:
    *   A channeled skill: continuously drains mana while active.
    *   Periodically hits all enemies within a `radius` around the player.
    *   Damage and rotation speed scale with player level.
    *   Can block incoming projectiles within its radius.
*   **Mana Cost**: Initial cost + level scaling, continuous `channel_cost_per_second`.
*   **Cooldown**: 0 (no cooldown, but channeled).
*   **Visuals**: Displays multiple orbiting weapon sprites around the player that rotate and follow the player's movement.

### Ice Nova Skill (`entities/ice_nova.py`)

*   **Description**: Unleashes a devastating ring of frost that expands outward, freezing enemies at the epicenter and chilling those further away.
*   **Mechanics**:
    *   Casts a pulsating nova that expands to a `max_radius` and then contracts.
    *   Damage is calculated based on player level using breakpoints and scales with distance from the epicenter (inner ring deals more damage and freezes, outer ring deals less damage and chills).
    *   Applies freeze (full slow) or chill (partial slow) status effects.
    *   Creates a static "Ice Nova Barrier" at the cast location that deals damage over time, applies a strong slow, and blocks most projectiles.
*   **Mana Cost**: Initial cost + level scaling.
*   **Cooldown**: 0.5 seconds.
*   **Passive Interaction**:
    *   **Nova Overload**: Increases the maximum radius and damage of Ice Nova.
    *   **Double Size Barrier**: Increases the size of the Ice Nova Barrier.
*   **Visuals**: The main nova is a pulsating ring of frost particles. The barrier is a dark blue, glowing, grid-patterned circle with a flicker effect.

### Summon Skeletons Skill (`entities/summon_skeletons.py`)

*   **Description**: Summons a random number of skeletons (1-3) to fight for the player.
*   **Mechanics**:
    *   Summons friendly `Skeleton` entities that act as minions.
    *   Skeletons have their own health, damage, and speed, which scale with player level.
    *   Skeletons prioritize attacking nearby enemies and will follow the player if no enemies are present.
    *   Skeletons can apply `Necrotic Plague` and `Singularity Core` debuffs to enemies if the player has the corresponding skills.
    *   Skeletons can absorb 50% of projectile damage.
*   **Mana Cost**: Loaded from `data/skills.json` (default 20).
*   **Cooldown**: Loaded from `data/skills.json` (default 1 second).
*   **Passive Interaction**:
    *   **Skeleton Armor**: Increases skeleton health.
    *   **Skeleton Overlord**: Every 10th summoned skeleton is an "Overlord" with significantly increased health and damage, and a larger visual scale.
    *   **Necrotic Plague**: Skeletons have a chance to apply this debuff on hit, which spreads to nearby enemies upon the afflicted enemy's death.
    *   **Singularity Core**: Skeletons have a chance to apply this debuff on hit, which creates a singularity that pulls enemies in.
*   **Visuals**: Skeletons are represented by a humanoid skeleton sprite. A `WraithEffect` (a fading shadow sprite) is also created upon summoning.

### Summon Spiders Skill (`entities/summon_spiders.py`)

*   **Description**: Summons a swarm of spiders to fight for the player.
*   **Mechanics**:
    *   Summons multiple friendly `Spider` entities that act as minions.
    *   Spiders have their own health, damage, and speed, which scale with player level.
    *   Spiders prioritize attacking nearby enemies and will follow the player if no enemies are present.
    *   Spiders apply a slow and poison effect on hit.
    *   Spiders can absorb 50% of projectile damage.
    *   Upon death, spiders can explode, dealing area damage and potentially spawning smaller spiders if the "Arachnophobia" passive is active.
*   **Mana Cost**: Loaded from `data/skills.json` (default 30).
*   **Cooldown**: Loaded from `data/skills.json` (default 10 seconds, reduced to 4 seconds with "Skeleton Armor" skill).
*   **Passive Interaction**:
    *   **Webweaver's Wrath**: Spiders have a chance to create a `WebEffect` on hit, which further slows and entangles enemies.
    *   **Arachnophobia**: When a spider dies, it explodes, dealing damage in an area and spawning smaller spiders.
*   **Visuals**: Spiders are represented by various spider sprites. `WebEffect` creates a visual web on the ground.

## HUD (Heads-Up Display)
The HUD, implemented in `ui/hud.py`, provides crucial real-time information to the player. It dynamically scales its elements based on screen resolution.

Key HUD elements include:
-   **Health Bar**: Displays `player.current_life` against `player.max_life` in red.
-   **Energy Shield Bar**: Shows `player.current_energy_shield` against `player.max_energy_shield` in a light blue/purple color.
-   **Mana Bar**: Represents `player.current_mana` against `player.max_mana` in blue.
-   **Profit Paste Bar**: A unique bar displaying `player.paste` progress towards a 50,000 unit threshold, indicating "Profit Paste" accumulation. A prompt appears when a new 50,000 unit threshold is reached, encouraging the player to open the skill tree.
-   **Experience Gauge**: Shows `player.experience` progress towards the next level (`player.level * 100`), displayed in light blue. It also indicates the current level and XP remaining.
-   **Level Up Button**: A green "+" button appears next to the experience gauge when the player has unspent skill points (`player.level - player.spent_level_points > 0`). Clicking this button transitions the game to the "level_up_screen".
-   **Skill Cooldown Gauges**: Displays the cooldown status for specific skills the player possesses, such as "Summon Spiders" and "Summon Skeletons". It shows an orange bar filling up during cooldown and turns green when the skill is "Ready!".
-   **Minion Counts**: Shows the current number of active friendly spiders and skeletons summoned by the player's skills.
-   **Countdown Timer**: An active countdown timer is displayed, specifically for the "tower4" scene, showing "Time Remaining: MM:SS".
-   **Minimap**: The minimap, implemented in `ui/minimap.py`, is integrated into the HUD. It provides a top-down view of the current scene, showing the player's position, nearby NPCs (blue dots/purple arrows), enemies (yellow dots), and boss portals (red dots/glowing effect).
    -   **Minimap Functionality**:
        -   **Dynamic Scaling**: The minimap adjusts its size and position based on the current screen resolution.
        -   **Tilemap Rendering**: It renders a scaled version of the current scene's tilemap, caching it for performance.
        -   **Entity Representation**: Displays player, NPC, enemy, and boss portal locations.
        -   **Portal Glow**: Boss portals have a pulsating red glow effect on the minimap.
        -   **Off-screen Indicators**: Arrows indicate the direction of off-screen NPCs (purple) and the teleporter menu portal (orange).
        -   **Enlarge/Close Buttons**: A "+" button allows the player to enlarge the minimap to half the screen size, and an "X" button closes the enlarged view.
## Save/Load System

The game's save/load system is managed by the `SaveMenu` class in `ui/save_menu.py`. This system allows players to save their current game progress and load previously saved games.

### Save Game (`save_game` method)

The `save_game` method gathers various pieces of player and game state data and serializes them into a JSON file.

*   **Player Data**:
    *   `class`: The player's chosen class name.
    *   `stats`: Player's current statistics (e.g., health, mana, damage).
    *   `skills`: List of skills the player possesses.
    *   `level`: Player's current level.
    *   `x`, `y`: Player's current position on the map.
    *   `paste_tree`: Includes `acquired_paste_nodes` (nodes unlocked in the Paste Tree) and `paste` (Profit Paste currency).
*   **Quest Tracker Data**:
    *   `active_quests`: Details of all currently active quests, including their name, description, objectives, associated tilemap scene, completion status, and unlock status.
    *   `completed_quests`: Details of all quests that have been completed.
    *   `current_active_quest_index`: The index of the currently tracked active quest.
*   **File Naming**: Save files are named sequentially (e.g., `save_1.json`, `save_2.json`) and stored in the `saves/` directory. The system automatically determines the next available save slot.
*   **Data Conversion**: The `_convert_save_data` helper method ensures that data types like `set` (which are not directly JSON serializable) are converted to `list` before saving.

### Load Game (`load_game` method)

The `load_game` method reads a selected save file and restores the game state based on the saved data.

*   **Selection**: The player selects a save file from a list displayed in the `SaveMenu`.
*   **Player Data Restoration**:
    *   The player's class, stats, skills, level, position, and Profit Paste data are loaded and applied to the `game.player` object.
    *   `current_life`, `current_mana`, and `current_energy_shield` are capped at their respective maximums to prevent loading into an over-healed state.
*   **Paste Tree Restoration**: The `PasteTreeManager` is used to load the player's acquired Paste Tree nodes.
*   **Quest Tracker Restoration**:
    *   The `QuestTracker` is re-initialized with the saved `active_quests`, `completed_quests`, and `current_active_quest_index`.
    *   If no quest data is found in the save file, a fresh quest tracker is initialized with the starting quest.
    *   The `_parse_objective_data` method is used to correctly parse objective data during loading.
*   **Scene Transition**: After loading, the game transitions the player to the "spawn_town" scene.

### Save File Management (`load_save_files` method)

The `load_save_files` method scans the `saves/` directory and populates a list of available save files for the player to choose from. It specifically looks for files starting with "save_" and ending with ".json".

### UI and Interaction

The `SaveMenu` provides a user interface for interacting with the save/load system:

*   **Buttons**: "Back", "Save Game", and "Load Game" buttons are provided.
*   **Save File List**: Displays a list of existing save files. Players can click on a save file to select it. The selected save file is highlighted.
*   **Dynamic Positioning**: UI elements are dynamically repositioned on screen resize to maintain a consistent layout.
