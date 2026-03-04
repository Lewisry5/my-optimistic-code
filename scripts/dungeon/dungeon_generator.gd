extends Node2D
class_name DungeonGenerator

## Number of rooms to generate per floor.
@export var room_count: int = 8
## Minimum room size in tiles.
@export var min_room_size: Vector2i = Vector2i(7, 7)
## Maximum room size in tiles.
@export var max_room_size: Vector2i = Vector2i(12, 12)
## Corridor width in tiles.
@export var corridor_width: int = 3
## Floor tile ID in the TileSet.
@export var floor_tile_id: int = 0
## Wall tile ID in the TileSet.
@export var wall_tile_id: int = 1

@onready var tile_map: TileMapLayer = $TileMapLayer

var rooms: Array[Rect2i] = []
var room_centers: Array[Vector2i] = []

signal dungeon_generated
signal room_entered(room_index: int)


func generate() -> void:
	rooms.clear()
	room_centers.clear()
	tile_map.clear()

	_place_rooms()
	_connect_rooms()
	_place_walls()

	dungeon_generated.emit()


func _place_rooms() -> void:
	var max_attempts := room_count * 10

	for i in max_attempts:
		if rooms.size() >= room_count:
			break

		var room_size := Vector2i(
			randi_range(min_room_size.x, max_room_size.x),
			randi_range(min_room_size.y, max_room_size.y)
		)

		var room_pos := Vector2i(
			randi_range(-30, 30),
			randi_range(-30, 30)
		)

		var new_room := Rect2i(room_pos, room_size)

		# Check overlap with existing rooms (with 2-tile padding)
		var overlaps := false
		for existing_room in rooms:
			if new_room.grow(2).intersects(existing_room):
				overlaps = true
				break

		if not overlaps:
			rooms.append(new_room)
			var center := Vector2i(
				room_pos.x + room_size.x / 2,
				room_pos.y + room_size.y / 2
			)
			room_centers.append(center)
			_carve_room(new_room)


func _carve_room(room: Rect2i) -> void:
	for x in range(room.position.x, room.position.x + room.size.x):
		for y in range(room.position.y, room.position.y + room.size.y):
			tile_map.set_cell(Vector2i(x, y), floor_tile_id, Vector2i(0, 0))


func _connect_rooms() -> void:
	# Connect each room to the next one using L-shaped corridors
	for i in range(room_centers.size() - 1):
		var from := room_centers[i]
		var to := room_centers[i + 1]
		_carve_corridor(from, to)


func _carve_corridor(from: Vector2i, to: Vector2i) -> void:
	var half_width := corridor_width / 2

	# Horizontal segment
	var x_start := mini(from.x, to.x)
	var x_end := maxi(from.x, to.x)
	for x in range(x_start, x_end + 1):
		for w in range(-half_width, half_width + 1):
			tile_map.set_cell(Vector2i(x, from.y + w), floor_tile_id, Vector2i(0, 0))

	# Vertical segment
	var y_start := mini(from.y, to.y)
	var y_end := maxi(from.y, to.y)
	for y in range(y_start, y_end + 1):
		for w in range(-half_width, half_width + 1):
			tile_map.set_cell(Vector2i(to.x + w, y), floor_tile_id, Vector2i(0, 0))


func _place_walls() -> void:
	# Add walls around all floor tiles
	var floor_cells := tile_map.get_used_cells()
	var wall_positions: Array[Vector2i] = []

	for cell in floor_cells:
		# Check all 8 neighbors
		for dx in range(-1, 2):
			for dy in range(-1, 2):
				if dx == 0 and dy == 0:
					continue
				var neighbor := Vector2i(cell.x + dx, cell.y + dy)
				if tile_map.get_cell_source_id(neighbor) == -1:
					wall_positions.append(neighbor)

	for pos in wall_positions:
		tile_map.set_cell(pos, wall_tile_id, Vector2i(0, 0))


func get_spawn_position() -> Vector2:
	if room_centers.is_empty():
		return Vector2.ZERO
	# Spawn in the center of the first room
	return tile_map.map_to_local(room_centers[0])


func get_room_center_world(room_index: int) -> Vector2:
	if room_index < 0 or room_index >= room_centers.size():
		return Vector2.ZERO
	return tile_map.map_to_local(room_centers[room_index])


func get_random_room_position(room_index: int) -> Vector2:
	if room_index < 0 or room_index >= rooms.size():
		return Vector2.ZERO
	var room := rooms[room_index]
	var rand_pos := Vector2i(
		randi_range(room.position.x + 1, room.position.x + room.size.x - 2),
		randi_range(room.position.y + 1, room.position.y + room.size.y - 2)
	)
	return tile_map.map_to_local(rand_pos)
