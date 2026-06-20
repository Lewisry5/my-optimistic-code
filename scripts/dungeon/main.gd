extends Node2D

## Main scene: orchestrates dungeon generation, player spawning, and enemy placement.

@export var enemy_scene: PackedScene
@export var enemies_per_room: int = 3

@onready var dungeon: DungeonGenerator = $DungeonGenerator
@onready var player: CharacterBody2D = $Player
@onready var camera: Camera2D = $Camera
@onready var hud: CanvasLayer = $HUD

var game_manager: Node


func _ready() -> void:
	# Set up game manager as autoload-style singleton
	game_manager = preload("res://scripts/systems/game_manager.gd").new()
	add_child(game_manager)

	game_manager.run_started.connect(_on_run_started)
	game_manager.run_ended.connect(_on_run_ended)

	player.player_died.connect(_on_player_died)
	player.health_changed.connect(_on_health_changed)

	camera.set_target(player)

	_start_new_run()


func _start_new_run() -> void:
	game_manager.start_run()


func _generate_floor() -> void:
	dungeon.generate()

	# Place player at first room
	player.global_position = dungeon.get_spawn_position()
	camera.global_position = player.global_position

	# Spawn enemies in rooms (skip room 0 which is the spawn room)
	_spawn_enemies()


func _spawn_enemies() -> void:
	if not enemy_scene:
		return

	var difficulty := game_manager.get_difficulty_multiplier()

	for i in range(1, dungeon.rooms.size()):
		var count := enemies_per_room + floori((game_manager.current_floor - 1) * 0.5)
		for j in count:
			var enemy := enemy_scene.instantiate() as BaseEnemy
			enemy.global_position = dungeon.get_random_room_position(i)

			# Scale with difficulty
			enemy.max_hp = roundi(enemy.max_hp * difficulty)
			enemy.hp = enemy.max_hp
			enemy.contact_damage = roundi(enemy.contact_damage * difficulty)

			enemy.enemy_died.connect(_on_enemy_died)
			game_manager.register_enemy()
			add_child(enemy)


func _on_enemy_died(_enemy: BaseEnemy) -> void:
	game_manager.on_enemy_killed()
	camera.shake(0.3)

	if game_manager.is_floor_cleared():
		_on_floor_cleared()


func _on_floor_cleared() -> void:
	# TODO: Show portal/stairs to next floor
	game_manager.advance_floor()
	_generate_floor()


func _on_player_died() -> void:
	camera.shake(1.0, 3.0)
	game_manager.end_run()


func _on_run_started() -> void:
	_generate_floor()


func _on_run_ended(floor_reached: int, kills: int) -> void:
	print("Run ended! Reached floor %d with %d kills" % [floor_reached, kills])
	# TODO: Show game over screen with stats


func _on_health_changed(new_hp: int, max_hp: int) -> void:
	# Update HUD health display
	if hud and hud.has_method("update_health"):
		hud.update_health(new_hp, max_hp)
