// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {InterestLib} from "./libraries/InterestLib.sol";
import {NegRiskIdLib} from "./libraries/NegRiskIdLib.sol";
import {CalculatorHelper} from "./libraries/CalculatorHelper.sol";
import {IConditionalTokens} from "./interfaces/IConditionalTokens.sol";
import {IPredictDotLoan} from "./interfaces/IPredictDotLoan.sol";
import {ICTFExchange, Order, Side} from "./interfaces/ICTFExchange.sol";
import {IUmaCtfAdapter} from "./interfaces/IUmaCtfAdapter.sol";
import {INegRiskAdapter} from "./interfaces/INegRiskAdapter.sol";


contract MarketSense is AccessControl, EIP712, ERC1155Holder, IPredictDotLoan, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using InterestLib for uint256;
    mapping(uint256 positionId => address owner) private positionOwner;
    mapping(uint256 positionId => bytes32 questionId) private positionQuestion;
    mapping(uint256 positionId => uint256 amount) private positionAmount;

    ERC20 public LOAN_TOKEN;

    IConditionalTokens public CTF;

    constructor(
        address _owner,
        address _ctfExchange,
        address _umaCtfAdapter,
    ) EIP712("marketSense", "1") {
        CTF_EXCHANGE = ICTFExchange(_ctfExchange);
        NEG_RISK_CTF_EXCHANGE = ICTFExchange(_negRiskCtfExchange);

        LOAN_TOKEN = IERC20(CTF_EXCHANGE.getCollateral());

        UMA_CTF_ADAPTER = _umaCtfAdapter;

        CTF = IConditionalTokens(CTF_EXCHANGE.getCtf());

        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
    }

    function predict(uint256 amountForPrediction,uint256 questionId, uint256 positionId) external override nonReentrant whenNotPaused {
        positionOwner[positionId] = msg.sender;
        positionQuestion[positionId] = questionId;
        positionAmount[positionId] = amountForPrediction;
        CTF.safeTransferFrom(msg.sender, address(this), positionId, amountForPrediction, "");
    }

    function redeem(uint256 positionId) external override nonReentrant whenNotPaused {
        require(positionsOwner[positionId] == msg.sender, "MarketSense: Only predictor can redeem");
        require(_assertBinaryOutcomeQuestionPriceUnavailable() == false, "Price not available yet")
        amount = positionAmount[positionId];
        LOAN_TOKEN.safeTransferFrom(address(this), msg.sender, amount);
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        _assertTokenReceivedIsCTF();
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual override returns (bytes4) {
        _assertTokenReceivedIsCTF();
        return this.onERC1155BatchReceived.selector;
    }

    }

    function _assertBinaryOutcomeQuestionPriceUnavailable(address umaCtfAdapter, bytes32 questionId) private view {
        (bool isAvailable, bytes4 umaError) = _isBinaryOutcomeQuestionPriceAvailable(umaCtfAdapter, questionId);
        
        if (isAvailable) {
            revert QuestionResolved();
        }
    }

    function _assertQuestionPriceUnavailable(QuestionType questionType, bytes32 questionId) private view {
        if (questionType == QuestionType.Binary) {
            _assertBinaryOutcomeQuestionPriceUnavailable(UMA_CTF_ADAPTER, questionId);
        } 
    }

    function _isBinaryOutcomeQuestionPriceAvailable(
        address umaCtfAdapter,
        bytes32 questionId
    ) private view returns (bool isAvailable, bytes4 umaError) {
        try IUmaCtfAdapter(umaCtfAdapter).getExpectedPayouts(questionId) returns (uint256[] memory) {
            isAvailable = true;
        } catch (bytes memory reason) {
            isAvailable = false;
            umaError = bytes4(reason);
        }
    }

    function _isQuestionPriceAvailable(
        QuestionType questionType,
        bytes32 questionId
    ) private view returns (bool isAvailable) {
        if (questionType == QuestionType.Binary) {
            (isAvailable, ) = _isBinaryOutcomeQuestionPriceAvailable(UMA_CTF_ADAPTER, questionId);
        } 
    }