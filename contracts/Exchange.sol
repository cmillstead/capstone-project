//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

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
        address indexed token,
        address indexed user,
        uint256 amount,
        uint256 balance
    );
    event Withdraw(
        address indexed token,
        address indexed user,
        uint256 amount,
        uint256 balance
    );
    event Order(
        uint256 indexed id,
        address indexed user,
        address indexed tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Cancel(
        uint256 indexed id,
        address indexed user,
        address indexed tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Trade(
        uint256 indexed id,
        address indexed user,
        address indexed tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address userFill,
        uint256 timestamp
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

    // -----------------------------------------
    // DEPOSIT & WITHDRAW TOKEN     

    function depositToken(address _token, uint256 _amount) external {
        // transfer tokens to exchange
        require(
            Token(_token).transferFrom(msg.sender, address(this), _amount),
            "Insufficient balance"
        );

        // update user balance
        tokens[_token][msg.sender] += _amount;

        // emit event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint256 _amount) external {
        // ensure user has enough tokens to withdraw
        require(tokens[_token][msg.sender] >= _amount, "Insufficient balance");

        // transfer tokens to user
        require(
            Token(_token).transfer(msg.sender, _amount),
            "Transfer failed"
        );

        // update user balance
        tokens[_token][msg.sender] -= _amount;

        // emit event
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }

    // -----------------------------------------
    // MAKE & CANCEL ORDERS

    function makeOrder(
        address _tokenGet, // the token the user wants to receive
        uint256 _amountGet, // the amount the user wants to receive
        address _tokenGive, // the token the user wants to spend
        uint256 _amountGive // the amount the user wants to spend
    ) public {
        // prevent orders if tokens arent on exchange
        require(balanceOf(_tokenGive, msg.sender) >= _amountGive, "Insufficient balance");

        orderCount++;
        
        // instantiate new order
        orders[orderCount] = _Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );

        // emit event
        emit Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );
    }

    function cancelOrder(uint256 _id) public {
        // fetch order from storage
        _Order storage _order = orders[_id];

        // ensure the caller of the function is the person who made the order
        require(address(_order.user) == msg.sender, "Not your order");

        // order must exist
        require(_order.id == _id, "Invalid order");

        // update cancelled orders mapping
        orderCancelled[_id] = true;

        // emit event
        emit Cancel(
            _order.id,
            msg.sender,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive,
            block.timestamp
        );
    }
}     