extends CharacterBody3D

const MAX_SPEED := 24.0
const MAX_REVERSE := 9.0
const ACCEL := 16.0
const BRAKE := 32.0
const DRAG := 2.4
const STEER_RATE := 2.2

var speed := 0.0
var controlled := false
var touch_vector := Vector2.ZERO

func _physics_process(delta: float) -> void:
	if not controlled:
		speed = move_toward(speed, 0.0, 20.0 * delta)
		velocity = _forward() * speed
		move_and_slide()
		return

	var input_vec := touch_vector if touch_vector.length() > 0.04 else Input.get_vector("move_left", "move_right", "move_up", "move_down")
	var throttle := -input_vec.y
	var steer := input_vec.x

	if throttle > 0.04:
		speed += ACCEL * throttle * delta
	elif throttle < -0.04:
		if speed > 0.2:
			speed -= BRAKE * abs(throttle) * delta
		else:
			speed -= ACCEL * abs(throttle) * 0.6 * delta
	else:
		speed -= speed * DRAG * delta
		if abs(speed) < 0.05:
			speed = 0.0

	speed = clamp(speed, -MAX_REVERSE, MAX_SPEED)

	if abs(steer) > 0.04 and abs(speed) > 0.3:
		var grip := min(1.0, abs(speed) / 6.0)
		rotation.y += steer * STEER_RATE * delta * grip * sign(speed)

	velocity = _forward() * speed
	move_and_slide()
	global_position.y = 0.0

func _forward() -> Vector3:
	return Vector3(sin(rotation.y), 0.0, cos(rotation.y))
