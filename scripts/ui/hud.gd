extends CanvasLayer

@onready var health_bar: ProgressBar = $MarginContainer/VBoxContainer/HealthBar
@onready var health_label: Label = $MarginContainer/VBoxContainer/HealthBar/Label
@onready var floor_label: Label = $MarginContainer/VBoxContainer/FloorLabel
@onready var kills_label: Label = $MarginContainer/VBoxContainer/KillsLabel


func update_health(current: int, maximum: int) -> void:
	if health_bar:
		health_bar.max_value = maximum
		health_bar.value = current
	if health_label:
		health_label.text = "%d / %d" % [current, maximum]


func update_floor(floor_number: int) -> void:
	if floor_label:
		floor_label.text = "Floor %d" % floor_number


func update_kills(kills: int) -> void:
	if kills_label:
		kills_label.text = "Kills: %d" % kills
