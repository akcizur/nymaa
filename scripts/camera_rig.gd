extends Camera3D

@export var player_path: NodePath
@export var vehicle_path: NodePath

@export var foot_dist := 13.0
@export var foot_height := 19.0
@export var car_dist := 16.0
@export var car_height := 23.0
@export var car_look_ahead := 4.5

var _focus := Vector3.ZERO
var _follow_smooth := 7.0
var _camera_smooth := 6.0
var player
var vehicle

func _ready() -> void:
	player = get_node_or_null(player_path)
	vehicle = get_node_or_null(vehicle_path)
	if player:
		_focus = player.global_position

func _process(delta: float) -> void:
	if player == null or vehicle == null:
		return

	var driving: bool = vehicle.controlled
	var subject = vehicle if driving else player
	var height := car_height if driving else foot_height
	var dist := car_dist if driving else foot_dist
	var look_ahead := car_look_ahead if driving else 0.0

	var target_focus := subject.global_position
	if driving:
		target_focus += Vector3(sin(subject.rotation.y), 0.0, cos(subject.rotation.y)) * look_ahead

	_focus = _focus.lerp(target_focus, 1.0 - exp(-_follow_smooth * delta))

	var desired := Vector3(_focus.x, height, _focus.z + dist)
	global_position = global_position.lerp(desired, 1.0 - exp(-_camera_smooth * delta))

	if global_position.y < 6.0:
		global_position.y = 6.0

	look_at(Vector3(_focus.x, 1.0, _focus.z), Vector3.UP)
