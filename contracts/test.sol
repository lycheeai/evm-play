// SPDX-License-Identifier: MIT
// compiler version must be greater than or equal to 0.8.13 and less than 0.9.0
pragma solidity ^0.8.13;

contract Haha {
	bool value;

	constructor() {
		value = false;
	}

	function flipValue() public returns (bool) {
		value = !value;

		return value;
	}
}
