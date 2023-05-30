//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Token {
    string public name = "Dapp University";
    string public symbol = "DAPP";
    uint256 public decimals = 18;
    uint256 public totalSupply = 1000000 * (10**decimals); // 1,000,000 x 10^18

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(
        address indexed from, 
        address indexed to, 
        uint256 value
    ); 

    event Approval(
        address indexed owner, 
        address indexed spender, 
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
        require(_value <= balanceOf[msg.sender], "Not enough tokens");

        _transfer(msg.sender, _to, _value);

        // emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(
        address _from, 
        address _to, 
        uint256 _value
    ) 
        external 
        returns (bool success) 
    {        
        // check approval
        require(_value <= allowance[_from][msg.sender], "Not enough allowance");
        require(_value <= balanceOf[_from], "Not enough tokens");

        allowance[_from][msg.sender] -= _value;

        _transfer(_from, _to, _value);
        
        return true;
    }

    function _transfer(
        address _from, 
        address _to, 
        uint256 _value
    ) internal {
        require(_to != address(0), "Invalid recipient");

        balanceOf[_from] -= _value; 
        balanceOf[_to] += _value;
        emit Transfer(_from, _to, _value);
     } 

    function approve(address _spender, uint256 _value) 
        external 
        returns (bool success) 
    {
        require(_spender != address(0), "Invalid spender");

        allowance[msg.sender][_spender] = _value;
        
        emit Approval(msg.sender, _spender, _value);
        return true;
    }


    
}


 