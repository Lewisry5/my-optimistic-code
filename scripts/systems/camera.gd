extends Camera2D

## Smoothly follows the player with optional screen shake.

@export var follow_speed: float = 5.0
@export var max_shake_offset: float = 10.0

var target: Node2D = null
var shake_intensity: float = 0.0
var shake_decay: float = 5.0


func _ready() -> void:
	make_current()


func _process(delta: float) -> void:
	if target:
		global_position = global_position.lerp(target.global_position, follow_speed * delta)

	# Screen shake
	if shake_intensity > 0:
		offset = Vector2(
			randf_range(-1, 1) * shake_intensity * max_shake_offset,
			randf_range(-1, 1) * shake_intensity * max_shake_offset
		)
		shake_intensity = max(0, shake_intensity - shake_decay * delta)
	else:
		offset = Vector2.ZERO


func shake(intensity: float = 0.5, decay: float = 5.0) -> void:
	shake_intensity = intensity
	shake_decay = decay


func set_target(new_target: Node2D) -> void:
	target = new_target
