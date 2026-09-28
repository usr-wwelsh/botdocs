# Updates

## 2025-05-28

-   Created a new base scene class: Created a new class called `BaseGameplayScene` in `core/base_gameplay_scene.py` that handles the player, UI, and menu input handling.
-   Modified the `SpawnTown` scene to inherit from the new base class: Modified the `SpawnTown` scene to inherit from the new base class instead of `BaseScene`.
-   Updated the `SceneManager` to use the new base class: Updated the `SceneManager` to use the new base class when creating scenes.
-   Added the `load_image` function to `core/utils.py`: Added the `load_image` function to load images from the graphics assets.
-   Added the missing constants to `config/constants.py`: Added the `ENEMY_SPAWN_DISTANCE`, `ENEMY_DESPAWN_DISTANCE`, `PROJECTILE_LIFETIME`, `PROJECTILE_DESPAWN_DISTANCE`, and `ENEMY_SPAWN_COOLDOWN` constants to `config/constants.py`.
-   Removed the `set_player` call from `main.py`: Since the `player` is now being passed to the `SpawnTown` scene through the `BaseGameplayScene`, I removed the `set_player` call from `main.py`.
-   Moved the zone data loading to a separate function: Moved the zone data loading logic from `GameplayScene` to a separate function called `load_zone_data` in `core/utils.py`.
-   Updated the `handle_event` methods in the `TitleScreen`, `PauseMenu`, `SettingsMenu`, `CharacterStatsMenu`, `InventoryScreen`, and `SkillTreeUI` classes to only accept the `event` argument.
-   Fixed the scene transitions for the skill tree and options menus: Updated the `handle_event` methods in the `SkillTreeUI` and `SettingsMenu` classes to return to the previous scene.
-   Fixed the zone data loading in `SpawnTown`: Updated the `SpawnTown` to call the `load_zone_data` function and load the tilemap.
-   Fixed the title screen not displaying correctly: Modified the `core/game_engine.py` file to initialize the `TitleScreen` and set it as the initial scene.
-   Fixed the scene transitions: Modified the `core/scene_manager.py` file to handle scene instances correctly.
-   Fixed the back button in InfoScreen: Modified the `ui/title_screen.py` file to ensure that leaving the info screen takes the user back to the title screen.
-   Fixed the start game button: Modified the `ui/title_screen.py` file to ensure that the "Start Game" button takes the user to the `SpawnTown` scene.
-   Fixed the SpawnTown initialization: Modified the `core/spawn_town.py` and `core/game_engine.py` files to correctly initialize the `SpawnTown` scene.
-   Fixed the scene transitions from InventoryScreen and SkillTreeUI: Modified the `ui/inventory_screen.py` and `ui/skill_tree_ui.py` files to ensure that the back button takes the user back to the `PauseMenu`.

## 2025-05-29

-   Implemented a fixed camera system with zoom and offset features.
-   Added input handling for zoom in and zoom out actions using the + and - keys.
-   Limited the zoom level to a range between 0.5 and 2.0.
-   Added input handling for adjusting the camera offset using the arrow keys.
-   Limited the camera offset to a range between -200 and 200 in both x and y directions.
-   Ensured that the map_width and map_height values in BaseGameplayScene are correctly initialized with the values from the SpawnTown scene.
-   Tried drawing the player as a white rectangle instead of using a sprite.
-   Moved the camera position calculation from the draw() method to the update() method.
-   Adjusted the max_x and max_y calculations to account for the camera offset.
-   Set the player's initial position to the center of the screen.

## Remaining Work

-   Implement the skill gem system: Implement the mechanics of skill gems, including how they are socketed into items, how active and support gems link, and how support gems modify active skills.
-   Implement comprehensive combat: Implement real-time combat against AI constructs and corrupted beings. Damage calculation should be robust, considering base damage, modifiers from skills, passive tree, items, resistances, and critical strikes.
-   Implement status effects: Implement a variety of elemental and physical status effects (e.g., Burning, Chill, Freeze, Shock, Poison, Bleed) that interact with combat and character builds.
-   Implement procedural content: Implement procedural generation of maps and loot to ensure replayability.
-   Implement stripped-down graphics: Focus on clear, functional visuals using simple shapes and colors to prioritize performance and gameplay clarity.
-   Implement the passive skill tree: Implement the logic for the passive skill tree, including loading node data, managing node activation, and calculating the cumulative effects of activated nodes on character stats.
-   Implement experience and leveling: Handle experience point (XP) gain, character leveling up, and the allocation of passive skill points.
-   Implement character classes: Define the different character classes available to the player, including their starting attributes, unique bonuses, and potential ascendancy-like specializations.
-   Implement quests: Manage the game's quest system, including tracking objectives, triggering events, and handling quest rewards.
-   Implement item system: Define the base class for all items in the game, including common properties like name, type, and rarity. Implement specific properties and behaviors for weapon and armor items.
-   Implement enemy AI: Define the base class for all enemy characters, including their attributes, AI behaviors (movement, attack patterns), and combat logic.
-   Implement NPC interactions: Define non-player characters, such as quest givers, shopkeepers, and other interactable entities in the game world.
-   Implement save/load system: Implement a system to store player save files, allowing players to resume their progress.
-   Implement unit tests: Implement unit tests for the combat mechanics, inventory system, and loot generation logic.
-   Fix the issue where the player is not visible in the game.
-   Fix the issue where the in-game UI is not drawing properly.

## 2025-05-29 (Continued)

-   Adjusted camera boundaries in `core/base_gameplay_scene.py` to be less restrictive.
-   Increased player speed in `entities/player.py` to make movement more responsive.
-   Implemented the Teleport skill in `combat/skills.py`.
-   Loaded the Teleport skill into the player's available skills in `entities/player.py`.
-   Implemented the Teleport skill activation in `entities/player.py`.
-   Corrected the handle_event method in `entities/player.py` to properly handle keyboard input for movement.
-   Adjusted the noise_value ranges for different tile types in `world/map_generator.py` to generate more grass and streets.
-   Implemented tile-based collision detection in `entities/player.py` to prevent the player from moving through walls.
-   Implemented acceleration and deceleration for the player's movement in `entities/player.py`.
-   Fixed a bug where the player was teleporting when they walked.
  - Increased teleport range to 900