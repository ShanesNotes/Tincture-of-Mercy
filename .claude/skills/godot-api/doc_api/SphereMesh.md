## SphereMesh <- PrimitiveMesh

Class representing a spherical PrimitiveMesh.

**Props:**
- Height: float = 1.0
- IsHemisphere: bool = false
- RadialSegments: int = 64
- Radius: float = 0.5
- Rings: int = 32

- **height**: Full height of the sphere.
- **is_hemisphere**: If `true`, a hemisphere is created rather than a full sphere. **Note:** To get a regular hemisphere, the height and radius of the sphere must be equal.
- **radial_segments**: Number of radial segments on the sphere.
- **radius**: Radius of sphere.
- **rings**: Number of segments along the height of the sphere.

