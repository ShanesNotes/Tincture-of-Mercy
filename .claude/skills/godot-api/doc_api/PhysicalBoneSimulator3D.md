## PhysicalBoneSimulator3D <- SkeletonModifier3D

Node that can be the parent of PhysicalBone3D and can apply the simulation results to Skeleton3D.

**Methods:**
- IsSimulatingPhysics() -> bool - Returns a boolean that indicates whether the PhysicalBoneSimulator3D is running and simulating.
- PhysicalBonesAddCollisionException(Rid exception) - Adds a collision exception to the physical bone. Works just like the RigidBody3D node.
- PhysicalBonesRemoveCollisionException(Rid exception) - Removes a collision exception to the physical bone. Works just like the RigidBody3D node.
- PhysicalBonesStartSimulation(StringName[] bones = []) - Tells the PhysicalBone3D nodes in the Skeleton to start simulating and reacting to the physics world. Optionally, a list of bone names can be passed-in, allowing only the passed-in bones to be simulated.
- PhysicalBonesStopSimulation() - Tells the PhysicalBone3D nodes in the Skeleton to stop simulating.

