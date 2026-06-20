extends CharacterBody2D
class_name BaseEnemy

## Movement speed.
@export var move_speed: float = 80.0
## Max health.
@export var max_hp: int = 50
## Contact damage dealt to the player.
@export var contact_damage: int = 10
## Detection range in pixels.
@export var detection_range: float = 200.0
## Distance to maintain from player when attacking.
@export var attack_range: float = 40.0

enum State { IDLE, CHASE, ATTACK, HURT, DEAD }

var hp: int
var state: State = State.IDLE
var player: CharacterBody2D = null
var knockback_velocity: Vector2 = Vector2.ZERO

@onready var sprite: Sprite2D = $Sprite2D
@onready var detection_area: Area2D = $DetectionArea
@onready var hurtbox: Area2D = $Hurtbox

signal enemy_died(enemy: BaseEnemy)


func _ready() -> void:
	hp = max_hp
	# Set detection range
	var collision_shape := detection_area.get_child(0) as CollisionShape2D
	if collision_shape and collision_shape.shape is CircleShape2D:
		(collision_shape.shape as CircleShape2D).radius = detection_range


func _physics_process(delta: float) -> void:
	# Apply knockback
	if knockback_velocity.length() > 5:
		knockback_velocity = knockback_velocity.lerp(Vector2.ZERO, 10.0 * delta)
		velocity = knockback_velocity
		move_and_slide()
		return

	match state:
		State.IDLE:
			_idle_behavior(delta)
		State.CHASE:
			_chase_behavior(delta)
		State.ATTACK:
			_attack_behavior(delta)
		State.HURT:
			pass
		State.DEAD:
			pass


func _idle_behavior(_delta: float) -> void:
	velocity = Vector2.ZERO
	if player and global_position.distance_to(player.global_position) <= detection_range:
		state = State.CHASE


func _chase_behavior(_delta: float) -> void:
	if not player:
		state = State.IDLE
		return

	var distance := global_position.distance_to(player.global_position)

	if distance > detection_range * 1.5:
		state = State.IDLE
		return

	if distance <= attack_range:
		state = State.ATTACK
		return

	var direction := (player.global_position - global_position).normalized()
	velocity = direction * move_speed
	move_and_slide()

	# Flip sprite toward player
	if velocity.x < -5:
		sprite.flip_h = true
	elif velocity.x > 5:
		sprite.flip_h = false


func _attack_behavior(_delta: float) -> void:
	if not player:
		state = State.IDLE
		return

	var distance := global_position.distance_to(player.global_position)
	if distance > attack_range * 1.5:
		state = State.CHASE
		return

	velocity = Vector2.ZERO


func take_damage(amount: int) -> void:
	if state == State.DEAD:
		return

	hp -= amount
	state = State.HURT

	# Knockback away from player
	if player:
		var knockback_dir := (global_position - player.global_position).normalized()
		knockback_velocity = knockback_dir * 300.0

	# Flash red
	sprite.modulate = Color(1, 0.3, 0.3, 1)

	if hp <= 0:
		_die()
	else:
		await get_tree().create_timer(0.2).timeout
		sprite.modulate = Color.WHITE
		state = State.CHASE


func _die() -> void:
	state = State.DEAD
	enemy_died.emit(self)

	# Death animation: shrink and fade
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(sprite, "modulate:a", 0.0, 0.3)
	tween.tween_property(sprite, "scale", Vector2(0.5, 0.5), 0.3)
	await tween.finished
	queue_free()


func _on_detection_area_body_entered(body: Node2D) -> void:
	if body is CharacterBody2D and body.has_method("take_damage"):
		player = body
		state = State.CHASE


func _on_detection_area_body_exited(body: Node2D) -> void:
	if body == player:
		player = null
		state = State.IDLE


func _on_hurtbox_body_entered(body: Node2D) -> void:
	if body.has_method("take_damage") and body != self:
		body.take_damage(contact_damage)
