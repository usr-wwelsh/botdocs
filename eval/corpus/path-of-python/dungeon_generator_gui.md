# Dungeon Generator GUI

## Overview

The Dungeon Generator GUI is a tool for creating new dungeons in the game. It allows users to customize various aspects of the dungeon, such as its size, tileset, enemy types, and map generation algorithm. The GUI provides a visual interface for designing and generating dungeons, which can then be added to the game world.

## Files Involved

*   `ui/dungeon_generator_gui.py`: The main GUI file that handles user input and calls the dungeon generation functions.
*   `core/new_dungeon_generator.py`: Generates the dungeon data (tile map, width, height, etc.) based on user-defined parameters.
*   `ui/dungeon_gui_scene_generator.py`: Generates the dungeon scene file (`.py`) based on the generated dungeon data.

## GUI Components

*   **Width and Height:** Input fields for specifying the dimensions of the dungeon.
*   **Tileset:** Dropdown menu for selecting the tileset to use for the dungeon.
*   **Enemy Types:** Checkboxes for selecting the enemy types to include in the dungeon.
*   **Dungeon Name:** Input field for specifying the name of the dungeon.
*   **Portal Graphic:** Button for browsing and selecting the portal graphic.
*   **Map Algorithm:** Dropdown menu for selecting the map generation algorithm (Perlin noise or room-based).
*   **Portal Placement:** Dropdown menu for selecting the portal placement method (random or specific).
*   **Portal X and Y:** Input fields for specifying the exact coordinates of the portal (only enabled when "specific" portal placement is selected).
*   **Decorations:** Checkboxes for selecting decorations to add to the dungeon.
*   **Perlin Noise Threshold:** Input field for specifying the Perlin noise threshold (only used when "Perlin noise" map algorithm is selected).
*   **Generate Dungeon:** Button that triggers the dungeon generation process.
*   **Dungeon Frame:** Displays the generated dungeon.
*   **Toolbar Frame:** Contains buttons for placing objects, zooming, panning, and removing the dungeon.

## Dungeon Generation Process

1.  The user provides input through the GUI components.
2.  The user clicks the "Generate Dungeon" button.
3.  The `generate_dungeon` function in `ui/dungeon_generator_gui.py` is called.
4.  The `generate_dungeon` function retrieves the values from the GUI components and passes them to the `generate_new_dungeon` function in `core/new_dungeon_generator.py`.
5.  The `generate_new_dungeon` function generates the dungeon data (tile map, width, height, etc.) based on the provided parameters.
6.  The `generate_dungeon` function calls the `display_dungeon` function to display the generated dungeon in the GUI.
7.  The `generate_dungeon` function prompts the user to enter a filename for the dungeon.
8.  The `generate_dungeon` function calls the `save_dungeon_data` function to save the dungeon data to a JSON file and perform other actions.

## Saving the Dungeon Data

1.  The `save_dungeon_data` function in `ui/dungeon_generator_gui.py` is called.
2.  The `save_dungeon_data` function saves the dungeon data to a JSON file in the `data/dungeons` directory.
3.  The `save_dungeon_data` function calls the `generate_scene_file` function in `ui/dungeon_gui_scene_generator.py` to generate the dungeon scene file.
4.  The `save_dungeon_data` function calls the `add_scene_to_game_engine` function in `ui/dungeon_gui_scene_generator.py` to add the new scene to the `data/scenes.json` file.
5.  The `save_dungeon_data` function calls the `add_portal_to_spawntown` function in `ui/dungeon_gui_scene_generator.py` to add a portal to the new dungeon in `spawntown` in the `data/zone_data.json` file.

## Key Functions

*   `generate_new_dungeon` (core/new_dungeon_generator.py): Generates the dungeon data based on the provided parameters.
*   `generate_scene_file` (ui/dungeon_gui_scene_generator.py): Generates the dungeon scene file (`.py`) based on the generated dungeon data.
*   `add_scene_to_game_engine` (ui/dungeon_gui_scene_generator.py): Adds the new scene to the `data/scenes.json` file.
*   `add_portal_to_spawntown` (ui/dungeon_gui_scene_generator.py): Adds a portal to the new dungeon in `spawntown` in the `data/zone_data.json` file.
*   `find_portal_location` (ui/dungeon_gui_scene_generator.py): Finds a suitable location for the portal in `spawntown` near existing portals.

## Customization

The dungeon generation process can be customized by modifying the different parameters in the GUI. For example, you can change the size of the dungeon, select a different tileset, choose different enemy types, and use a different map generation algorithm.