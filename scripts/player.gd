extends CharacterBody3D

const SPEED := 7.0
const ROT_LERP := 14.0

var input_locked := false
var touch_vector := Vector2.ZERO

func _physics_process(delta: float) -> void:
	if input_locked:
		velocity = Vector3.ZERO
		move_and_slide()
		global_position.y = 0.0
		return

	var input_vec := touch_vector if touch_vector.length() > 0.04 else Input.get_vector("move_left", "move_right", "move_up", "move_down")
	var dir := Vector3(input_vec.x, 0.0, input_vec.y)

	if dir.length() > 0.01:
		dir = dir.normalized()
		velocity = dir * SPEED

		var target_angle := atan2(dir.x, dir.z)
		rotation.y = lerp_angle(rotation.y, target_angle, 1.0 - exp(-ROT_LERP * delta))
	else:
		velocity = Vector3.ZERO

	move_and_slide()
	global_position.y = 0.0
