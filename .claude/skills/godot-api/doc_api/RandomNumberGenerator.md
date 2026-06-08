## RandomNumberGenerator <- RefCounted

RandomNumberGenerator is a class for generating pseudo-random numbers. It currently uses . **Note:** The underlying algorithm is an implementation detail and should not be depended upon. To generate a random float number (within a given range) based on a time-dependent seed:

**Props:**
- Seed: int = 0
- State: int = 0

- **seed**: Initializes the random number generator state based on the given seed value. A given seed will give a reproducible sequence of pseudo-random numbers. **Note:** The RNG does not have an avalanche effect, and can output similar random streams given similar seeds. Consider using a hash function to improve your seed quality if they're sourced externally. **Note:** Setting this property produces a side effect of changing the internal `state`, so make sure to initialize the seed *before* modifying the `state`: **Note:** The default value of this property is pseudo-random, and changes when calling `randomize`. The `0` value documented here is a placeholder, and not the actual default seed.
- **state**: The current state of the random number generator. Save and restore this property to restore the generator to a previous state: **Note:** Do not set state to arbitrary values, since the random number generator requires the state to have certain qualities to behave properly. It should only be set to values that came from the state property itself. To initialize the random number generator with arbitrary input, use `seed` instead. **Note:** The default value of this property is pseudo-random, and changes when calling `randomize`. The `0` value documented here is a placeholder, and not the actual default state.

**Methods:**
- RandWeighted(float[] weights) -> int - Returns a random integer between `0` and the size of the array that is passed as a parameter. Each value in the array should be a floating-point number that represents the relative likelihood that it will be returned as an index. A higher value means the value is more likely to be returned as an index, while a value of `0` means it will never be returned as an index. For example, if [code skip-lint][0.5, 1, 1, 2][/code] is passed as a parameter, then the method is twice as likely to return `3` (the index of the value `2`) and twice as unlikely to return `0` (the index of the value `0.5`) compared to the indices `1` and `2`. Prints an error and returns `-1` if the array is empty.
- Randf() -> float - Returns a pseudo-random float between `0.0` and `1.0` (inclusive).
- RandfRange(float from, float to) -> float - Returns a pseudo-random float between `from` and `to` (inclusive).
- Randfn(float mean = 0.0, float deviation = 1.0) -> float - Returns a , pseudo-random floating-point number from the specified `mean` and a standard `deviation`. This is also known as a Gaussian distribution. **Note:** This method uses the algorithm.
- Randi() -> int - Returns a pseudo-random 32-bit unsigned integer between `0` and `4294967295` (inclusive).
- RandiRange(int from, int to) -> int - Returns a pseudo-random 32-bit signed integer between `from` and `to` (inclusive).
- Randomize() - Sets up a time-based seed for this RandomNumberGenerator instance. Unlike the [@GlobalScope] random number generation functions, different RandomNumberGenerator instances can use different seeds.

