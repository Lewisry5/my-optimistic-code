extends CharacterBody2D

## Player movement speed in pixels per second.
@export var move_speed: float = 200.0
## Dash speed multiplier.
@export var dash_speed_mult: float = 3.0
## Dash duration in seconds.
@export var dash_duration: float = 0.15
## Dash cooldown in seconds.
@export var dash_cooldown: float = 0.8
## Maximum health points.
@export var max_hp: int = 100
## Attack damage.
@export var attack_damage: int = 20
## Attack cooldown in seconds.
@export var attack_cooldown: float = 0.4
## Invincibility frames duration after taking damage.
@export var i_frames: float = 0.5

var hp: int
var is_dashing: bool = false
var can_dash: bool = true
var is_attacking: bool = false
var can_attack: bool = true
var is_invincible: bool = false
var last_direction: Vector2 = Vector2.DOWN

@onready var sprite: Sprite2D = $Sprite2D
@onready var attack_area: Area2D = $AttackArea
@onready var hurtbox: Area2D = $Hurtbox
@onready var dash_timer: Timer = $DashTimer
@onready var dash_cooldown_timer: Timer = $DashCooldownTimer
@onready var attack_timer: Timer = $AttackTimer
@onready var i_frame_timer: Timer = $IFrameTimer

signal health_changed(new_hp: int, max_hp: int)
signal player_died


func _ready() -> void:
	hp = max_hp
	dash_timer.wait_time = dash_duration
	dash_cooldown_timer.wait_time = dash_cooldown
	attack_timer.wait_time = attack_cooldown
	i_frame_timer.wait_time = i_frames
	attack_area.monitoring = false
	health_changed.emit(hp, max_hp)


func _physics_process(_delta: float) -> void:
	var input_dir := _get_input_direction()

	if input_dir != Vector2.ZERO:
		last_direction = input_dir.normalized()

	if Input.is_action_just_pressed("dash") and can_dash and input_dir != Vector2.ZERO:
		_start_dash()

	if Input.is_action_just_pressed("attack") and can_attack and not is_dashing:
		_start_attack()

	if is_dashing:
		velocity = last_direction * move_speed * dash_speed_mult
	elif is_attacking:
		velocity = Vector2.ZERO
	else:
		# Convert input to isometric movement
		var iso_dir := _cartesian_to_isometric(input_dir)
		velocity = iso_dir * move_speed

	move_and_slide()
	_update_sprite_direction()


func _get_input_direction() -> Vector2:
	return Vector2(
		Input.get_action_strength("move_right") - Input.get_action_strength("move_left"),
		Input.get_action_strength("move_down") - Input.get_action_strength("move_up")
	)


func _cartesian_to_isometric(cartesian: Vector2) -> Vector2:
	# Convert WASD input to isometric screen movement
	return Vector2(
		cartesian.x - cartesian.y,
		(cartesian.x + cartesian.y) * 0.5
	).normalized() * cartesian.length()


func _start_dash() -> void:
	is_dashing = true
	can_dash = false
	is_invincible = true
	dash_timer.start()


func _start_attack() -> void:
	is_attacking = true
	can_attack = false
	attack_area.monitoring = true

	# Position attack hitbox in the direction the player faces
	attack_area.position = last_direction * 32.0

	attack_timer.start()
	# Short delay then disable hitbox
	await get_tree().create_timer(0.15).timeout
	attack_area.monitoring = false
	is_attacking = false


func take_damage(amount: int) -> void:
	if is_invincible:
		return

	hp = max(0, hp - amount)
	health_changed.emit(hp, max_hp)
	is_invincible = true
	i_frame_timer.start()

	# Flash effect
	_flash_sprite()

	if hp <= 0:
		player_died.emit()


func heal(amount: int) -> void:
	hp = min(max_hp, hp + amount)
	health_changed.emit(hp, max_hp)


func _flash_sprite() -> void:
	sprite.modulate = Color(1, 0.3, 0.3, 1)
	await get_tree().create_timer(0.1).timeout
	sprite.modulate = Color.WHITE


func _update_sprite_direction() -> void:
	if velocity.length() > 10:
		# Flip sprite based on horizontal movement
		if velocity.x < -10:
			sprite.flip_h = true
		elif velocity.x > 10:
			sprite.flip_h = false


func _on_dash_timer_timeout() -> void:
	is_dashing = false
	is_invincible = false
	dash_cooldown_timer.start()


func _on_dash_cooldown_timer_timeout() -> void:
	can_dash = true


func _on_attack_timer_timeout() -> void:
	can_attack = true


func _on_i_frame_timer_timeout() -> void:
	is_invincible = false
	sprite.modulate = Color.WHITE


func _on_attack_area_body_entered(body: Node2D) -> void:
	if body.has_method("take_damage"):
		body.take_damage(attack_damage)
