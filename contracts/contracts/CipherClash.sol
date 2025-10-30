// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { LocalSepoliaConfig } from "./LocalZamaConfig.sol";
import {
    FHE,
    ebool,
    euint8,
    externalEuint8
} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title CipherClash
 * @notice 闂傚倷绀侀幉锟犳偡閵夛妇闄勯柡鍌氭櫇瑜庡鍕箛椤掑偆妲舵俊鐐€曠换鎰偓姘煎墴閹顢楅崟顒傚幗濡炪倖鎸鹃崑娑㈠汲闁秵鐓忛柛銉ｅ妽閳锋帡鏌℃笟鍥ф珝鐎规洘锕㈤垾锕傚箣濠靛浂鍟呴梻浣筋嚙缁绘帡宕戦幇鏉跨；闁瑰墽绮悡鏇熸叏濮楀棗澧板褋鍨介幃妤冩喆閸曨偀鏋欓梺杞扮缁夎埖绂掗敃鍌涘亗閹煎瓨蓱閻庡ジ姊?FHE 婵犵數鍎戠徊钘壝洪敂鐐床闁告劦浜栭崑鎾诲垂椤愶綆妫冮悗瑙勬穿缁叉寧绂掗敃鍌涘€锋い鎺戝€搁獮宥夋⒒娴ｅ憡鍟為柛銊ョ秺瀹曟洟濡堕崶锝呬壕婵椴搁弳顒佹叏婵犲洨鐣烘鐐叉喘椤㈡岸宕ㄩ鍓￠梻?
 * @dev 闂傚倷绀侀幉锟犳嚌妤ｅ啯鍋嬮煫鍥ㄦ磵閸嬫捇鎮烽幍顕嗙礊闂侀€炲苯澧繝鈧柆宥呯；婵☆垰鍚嬮浠嬫煏婢跺棙娅嗛柛?CipherClashRegistry 闂傚倸鍊风欢锟犲窗閹捐绀夐幖杈剧稻婵ジ鏌涘▎蹇ｆШ闁崇粯妫冮獮鏍ㄦ綇閸撗呅ｉ梺鍛婂焹閸嬫捇姊绘担钘夊惞闁稿绋戣灋閻庨潧鎲￠～鏇熺節闂堟侗鍎忕紒鐘劦閺屽秷顧侀柛鎾跺枎椤曪綁宕归銏㈢獮闁硅壈鎻徊濠氬磻閹烘鈷掑ù锝囶焾缁狙囨煕閵娿儳绉虹€?Registry 闂傚倷鑳堕幊鎾绘倶濮樺灈鈧箓宕堕澶嬫櫍闂佸綊妫跨粈浣界箽?
 */
contract CipherClash is LocalSepoliaConfig {
    enum RoomState {
        WaitingForOpponent,
        AwaitingMoves,
        MovesSubmitted,
        Resolved,
        Completed
    }

    enum MatchResult {
        Tie,
        PlayerAWin,
        PlayerBWin
    }

    address public immutable registry;
    address public playerA;
    address public playerB;

    uint96 public immutable stake;
    uint32 public immutable moveTimeout;
    uint32 public immutable rematchWindow;

    RoomState public state;
    uint256 public lastMoveTimestamp;

    euint8 private moveA;
    euint8 private moveB;
    euint8 private resultCode;

    bool public moveASubmitted;
    bool public moveBSubmitted;

    address public winner;
    uint8 public lastResultPlaintext;

    event MoveSubmitted(address indexed player);
    event MatchResolved(uint8 resultCode, address winner);
    event MatchFailed(string reason);
    event RematchReady();

    modifier onlyRegistry() {
        require(msg.sender == registry, "ONLY_REGISTRY");
        _;
    }

    modifier onlyPlayers() {
        require(msg.sender == playerA || msg.sender == playerB, "ONLY_PLAYERS");
        _;
    }

    constructor(
        address _registry,
        address _playerA,
        uint96 _stake,
        uint32 _moveTimeout,
        uint32 _rematchWindow
    ) {
        require(_registry != address(0), "REGISTRY_ZERO");
        require(_playerA != address(0), "PLAYER_ZERO");
        registry = _registry;
        playerA = _playerA;
        stake = _stake;
        moveTimeout = _moveTimeout;
        rematchWindow = _rematchWindow;
        state = RoomState.WaitingForOpponent;
    }

    /// @notice Registry 闂傚倷绶氬鑽ゆ嫻閻旂厧绀夐幖鎼厛閺佸嫰鏌涢妷锝呭妞も晜鐓￠幃姗€鎮欑捄鐩掓捇鏌涙繝鍐ㄢ枙闁哄矉绲介埞鍐倷椤掍胶褰呮俊鐐€栭弻銊х矓閻熸壆鏆︽繝闈涱儐閸嬫劙鏌熺紒妯虹瑨婵鐓″娲传閸曨偅娈查梺绋块閵堟悂骞嗛崘顔藉亜闁稿繒鍘ф禒娲⒑闂堟侗鐓紒鍙夋そ瀹?
    function join(address challenger) external onlyRegistry {
        require(state == RoomState.WaitingForOpponent, "STATE_ERROR");
        playerB = challenger;
        state = RoomState.AwaitingMoves;
        lastMoveTimestamp = block.timestamp;
    }

    /// @notice 闂傚倷鑳剁划顖涚珶閺囥垹鐤炬繛鎴欏焺閺佸﹦鈧箍鍎遍ˇ顖滅不閻㈠憡鐓欓梺顓ㄧ細缁ㄥジ鏌涢悙宸█闁哄本鐩顕€宕掑В瑁ゅ灲閺岋綁鏁傞挊澶屼紝閻庤娲橀悷鈺呭箖濠婂吘鐔哥瑹椤栨瑧绀勯梻?
    function submitMove(externalEuint8 encryptedMove, bytes calldata inputProof) external onlyPlayers {
        require(
            state == RoomState.AwaitingMoves || state == RoomState.MovesSubmitted,
            "STATE_ERROR"
        );

        if (msg.sender == playerA) {
            require(!moveASubmitted, "MOVE_ALREADY");
            moveA = FHE.fromExternal(encryptedMove, inputProof);
            FHE.allowThis(moveA);
            moveASubmitted = true;
        } else {
            require(!moveBSubmitted, "MOVE_ALREADY");
            moveB = FHE.fromExternal(encryptedMove, inputProof);
            FHE.allowThis(moveB);
            moveBSubmitted = true;
        }

        lastMoveTimestamp = block.timestamp;
        emit MoveSubmitted(msg.sender);

        if (moveASubmitted && moveBSubmitted) {
            state = RoomState.MovesSubmitted;
            _resolveMatch();
        }
    }

    /// @notice 闂備胶鍎甸崜婵堟暜閹烘绠犻煫鍥ㄦ惄濞撳鏌涘畝鈧崑娑氭喆閿曞倸绠归悗娑欘焽缁犳牜鈧娲樿ぐ鍐煡婢舵劕绠绘い鏍ㄧ煯婢规洟姊绘担铏瑰笡濠㈣娲熷鎻掆槈閵忊晜鏅╅悗骞垮劚椤︻垶鎯屽Δ浣典簻闁哄秲鍔忔竟妯肩磼鐠佸磭绐旈柡灞剧洴楠炴帡骞嬪┑鎰缂傚倷绶￠崰鎾诲礉鎼达絽鍨濋悹鍥ф▕濞撳鎮樿箛鏃傚ⅹ濞?
    function forceResolve() external onlyPlayers {
        require(state == RoomState.AwaitingMoves, "STATE_ERROR");
        require(block.timestamp > lastMoveTimestamp + moveTimeout, "TOO_EARLY");

        if (moveASubmitted && !moveBSubmitted) {
            _finalizeResult(MatchResult.PlayerAWin);
        } else if (!moveASubmitted && moveBSubmitted) {
            _finalizeResult(MatchResult.PlayerBWin);
        } else {
            // 闂傚倷绀侀幉锟犳偡閵夆晛瀚夋い鎺戝閽冪喖鏌ｉ弬鍨倯闁绘帡绠栭弻銈夊箒閹烘垵濮曢悗娈垮枟閹瑰洭寮婚悢铏圭＜婵☆垰鎼～鍫濃攽椤旀枻鍏紒鐘虫尭閻ｅ嘲鈻庨幘鏉戔偓缁樹繆椤栨瑨顒熷ù鐓庣墦濮婃椽骞愭惔锝傛闂佹椿鍘虹欢姘舵晲閻愮鍋撻敐搴′簽闁崇粯妫冮弻娑樷攽閸℃浼冮梺鐟板閸撶喖骞冨鈧幃娆撳煛娴ｅ嘲顥?
            _finalizeResult(MatchResult.Tie);
        }
    }

    /// @notice 婵犵數濮伴崹鐓庘枖濞戞氨鐭撶€规洖娲ㄧ粈濠囨煕濞戞鎽犻柛瀣姍閺屻倝宕妷顔芥瘜闂佺顑嗛幐濠氬箯閸涘瓨鎲ラ柛灞剧矒閻庢椽姊绘担濮愨偓鈧柛瀣尰閵囧嫰寮介妸褉妲堥梺浼欏瘜閸犳牠鈥︾捄銊﹀磯闁惧繐澧ｉ妷褏纾奸柛灞炬皑閻掔鈹戦埄鍐╁唉鐎规洘甯掗埢搴ㄥ箣閻橀潧甯?Registry 闂傚倷绶氬鑽ゆ嫻閻旂厧绀夐悘鐐电摂閸ゆ洖鈹戦悩瀹犲婵☆偅锕㈤弻娑㈡晜鐠囨彃绠伴梺閫炲苯澧い顓炴喘楠炲繒鈧綆鍠栧洿闂佸憡渚楅崰鏍焵椤掑倹鏆柟顔兼贡閳ь剨缍嗘禍婊堝汲閻斿吋鐓涘ù锝夋涧閳ь剚绻冩穱?
    function resetForRematch() external onlyRegistry {
        require(state == RoomState.Resolved || state == RoomState.Completed, "STATE_ERROR");
        require(block.timestamp <= lastMoveTimestamp + rematchWindow, "WINDOW_PASSED");

        moveASubmitted = false;
        moveBSubmitted = false;
        winner = address(0);
        lastResultPlaintext = 0;
        state = RoomState.AwaitingMoves;
        lastMoveTimestamp = block.timestamp;

        emit RematchReady();
    }

    /// @notice 闂備礁鎼ˇ顐﹀疾濠婂牆钃熼柕濞垮剭濞差亜鍐€妞ゆ挾鍋涢悵姗€姊洪柅鐐茶嫰婢у鈧鍣崜鐔肩嵁瀹ュ鏁婇柣鎰靛墮閻ㄩ箖姊绘担鍛婃儓妞ゆ垵妫涢崚鎺撴償閳锯偓閺嬫棃鏌熺€电袥闁稿鎹囧Λ鍐ㄢ槈濞嗘ɑ锛侀梻浣告惈椤戝懘宕幘顔兼瀬鐎广儱娲ｅ▽顏堟煠濞村娅堢紒缁樺灴濮婃椽宕ㄦ繝鍐ㄧ缂備礁顦悥濂搞€侀弮鍫晢闁稿本鐟﹂崟鍐⒑閸濆嫭宸濆┑顔惧缁傛帒鈽夐姀锛勫幍闁诲孩绋掗…鍥ㄦ櫠瀹曞洦鍋栨繛鍡樻尰閸婄敻姊婚崼鐔衡姇妞ゃ儲鎹囬弻?
    function getEncryptedResult() external view returns (euint8) {
        require(state == RoomState.Resolved || state == RoomState.Completed, "STATE_ERROR");
        return resultCode;
    }

    function _resolveMatch() internal {
        try this._computeResult(moveA, moveB) returns (euint8 encrypted) {
            resultCode = encrypted;
            FHE.allowThis(resultCode);
            FHE.makePubliclyDecryptable(resultCode);
            _finalizeResult(MatchResult.Tie);
        } catch Error(string memory reason) {
            emit MatchFailed(reason);
            state = RoomState.Completed;
        }
    }

    /// @notice 闂傚倷绀侀幉锛勬暜閹烘嚦娑樷槈閳垛斁鍋撻弽顓炵倞妞ゆ巻鍋撻柣顓燁殕閵囧嫰寮介妸褏顓煎┑鐐插悑鐢繝寮诲☉銏犵闁挎繂鎲涢幘缁樼厸闁糕剝鐟ラ弸娑㈡煛娴ｅ摜肖濞寸媴绠撻幃娆擃敆閸屾艾绠ユ繝?Hardhat/Foundry 闂備浇宕垫慨鎾敄閸涙潙鐤ù鍏兼綑閺嬩線鏌曢崼婵囷紞婵炲牏鏅埀顒€鍘滈崑鎾绘煕閹板吀绨兼い顐㈢Ч濮?
    function _computeResult(euint8 a, euint8 b) external returns (euint8 encrypted) {
        require(msg.sender == address(this), "ONLY_SELF");

        euint8 ROCK = FHE.asEuint8(uint8(0));
        euint8 SCISSORS = FHE.asEuint8(uint8(1));
        euint8 PAPER = FHE.asEuint8(uint8(2));

        ebool aRock = FHE.eq(a, ROCK);
        ebool aScissors = FHE.eq(a, SCISSORS);
        ebool aPaper = FHE.eq(a, PAPER);

        ebool bRock = FHE.eq(b, ROCK);
        ebool bScissors = FHE.eq(b, SCISSORS);
        ebool bPaper = FHE.eq(b, PAPER);

        ebool aBeatsB = FHE.or(
            FHE.or(FHE.and(aRock, bScissors), FHE.and(aScissors, bPaper)),
            FHE.and(aPaper, bRock)
        );

        ebool tie = FHE.eq(a, b);

        euint8 tieCode = FHE.asEuint8(uint8(MatchResult.Tie));
        euint8 aWinCode = FHE.asEuint8(uint8(MatchResult.PlayerAWin));
        euint8 bWinCode = FHE.asEuint8(uint8(MatchResult.PlayerBWin));

        euint8 code = FHE.select(
            tie,
            tieCode,
            FHE.select(aBeatsB, aWinCode, bWinCode)
        );

        FHE.allowThis(code);
        return code;
    }

    function _finalizeResult(MatchResult result) internal {
        state = RoomState.Resolved;
        lastResultPlaintext = uint8(result);

        if (result == MatchResult.PlayerAWin) {
            winner = playerA;
        } else if (result == MatchResult.PlayerBWin) {
            winner = playerB;
        } else {
            winner = address(0);
        }

        emit MatchResolved(uint8(result), winner);
    }

    /// @notice Registry 闂傚倷绶氬鑽ゆ嫻閻旂厧绀夌€光偓閸曨剙浠煎銈嗗笒鐎氼剛绮婚敐澶嬬厵闂侇叏绠戦弸銈嗙箾婢跺牆鐏紒杈ㄥ浮閹晠骞囨担鍦殽闂備浇顕栭崰妤呫€冮崼銉ョ妞ゆ劧绠戠粈鍐┿亜韫囨挻鍣烘繛鍫涘灲濮婃椽骞愭惔锝傛闂佸搫鐗滈崜鐔煎箖閵夆晜鏅查柛銉ｅ妼椤庢盯姊虹紒姗嗘當闁绘妫濋幃锟犳晲婢跺鎷婚梺绋挎湰濮樸劑骞楅悩鐢电＜濞撴艾锕ら々顒傜磼椤旂晫鎳呴柍褜鍓ㄧ紞鍡涘礈濞戞ǚ鏋栭柕蹇嬪€栭悡娑橆熆鐠洪缚瀚伴柡瀣€块弻?
    function markCompleted() external onlyRegistry {
        require(state == RoomState.Resolved, "STATE_ERROR");
        state = RoomState.Completed;
    }
}
