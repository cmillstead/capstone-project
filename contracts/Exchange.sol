//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Exchange {
    address public feeAccount; // the account that receives exchange fees
    uint256 public feePercent; // the fee percentage
    address constant ETHER = address(0); // store Ether in tokens mapping with blank address
    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => _Order) public orders;
    uint256 public orderCount;
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled;

    // Events
    event Deposit(
        address indexed _token,
        address indexed _user,
        uint256 _amount,
        uint256 _balance
    );
    event Withdraw(
        address indexed _token,
        address indexed _user,
        uint256 _amount,
        uint256 _balance
    );
    event Order(
        uint256 indexed _id,
        address indexed _user,
        address indexed _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive,
        uint256 _timestamp
    );
    event Cancel(
        uint256 indexed _id,
        address indexed _user,
        address indexed _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive,
        uint256 _timestamp
    );
    event Trade(
        uint256 indexed _id,
        address indexed _user,
        address indexed _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive,
        address _userFill,
        uint256 _timestamp
    );

    // Structs
    struct _Order {
        uint256 id;
        address user;
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timestamp;
    }

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // Fallback: reverts if Ether is sent to this smart contract by mistake
    fallback() external {
        revert();
    }

    // Receive: called when Ether is sent to this smart contract
    receive() external payable {
        revert();
    }

    function depositEther() external payable {
        tokens[ETHER][msg.sender] += msg.value;
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender ]);
    }       
}    