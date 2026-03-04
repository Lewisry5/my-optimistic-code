extends Node

## Manages the overall game state, floor progression, and roguelite meta loop.

var current_floor: int = 1
var enemies_remaining: int = 0
var total_kills: int = 0
var run_active: bool = false

# Meta-progression (persists between runs)
var total_runs: int = 0
var best_floor: int = 0
var currency: int = 0

signal floor_changed(floor_number: int)
signal enemies_updated(remaining: int)
signal run_started
signal run_ended(floor_reached: int, kills: int)


func start_run() -> void:
	current_floor = 1
	total_kills = 0
	run_active = true
	total_runs += 1
	floor_changed.emit(current_floor)
	run_started.emit()


func end_run() -> void:
	run_active = false
	if current_floor > best_floor:
		best_floor = current_floor
	run_ended.emit(current_floor, total_kills)


func advance_floor() -> void:
	current_floor += 1
	floor_changed.emit(current_floor)


func register_enemy() -> void:
	enemies_remaining += 1
	enemies_updated.emit(enemies_remaining)


func on_enemy_killed() -> void:
	enemies_remaining -= 1
	total_kills += 1
	enemies_updated.emit(enemies_remaining)


func is_floor_cleared() -> bool:
	return enemies_remaining <= 0


func get_difficulty_multiplier() -> float:
	# Scales enemy stats per floor
	return 1.0 + (current_floor - 1) * 0.15
