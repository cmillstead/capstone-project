//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Token {
    string public name = "Dapp University";
    string public symbol = "DAPP";
    uint256 public decimals = 18;
    uint256 public totalSupply = 1000000 * (10**decimals); // 1,000,000 x 10^18

    mapping(address => uint256) public balanceOf;

    event Transfer(
        address indexed from, 
        address indexed to, 
        uint256 value
    ); 

    constructor(
        string memory _name, 
        string memory _symbol, 
        uint256 _totalSupply
    ) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * (10**decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint256 _value) 
        external 
        returns (bool success) 
    {
        require(balanceOf[msg.sender] >= _value, "Not enough tokens");
        require(_to != address(0), "Invalid recipient");   

        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);
        return true;
    }


    
}


 