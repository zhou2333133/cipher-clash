// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { CipherClash } from "./CipherClash.sol";

/**
 * @title CipherClashRegistry
 * @notice 部署并管理 CipherClash 房间，同时负责押注托管与积分排行榜。
 */
contract CipherClashRegistry {
    struct RoomInfo {
        address contractAddress;
        address playerA;
        address playerB;
        uint96 stake;
        bool rankingEnabled;
        bool completed;
    }

    struct PlayerStats {
        uint32 wins;
        uint32 losses;
        uint32 ties;
        uint64 points;
    }

    struct LeaderboardEntry {
        address player;
        uint64 points;
        uint32 wins;
        uint32 losses;
        uint32 ties;
    }

    uint256 public roomCounter;
    mapping(uint256 => RoomInfo) public rooms;
    mapping(address => PlayerStats) public stats;

    address[] private leaderboardMembers;
    mapping(address => bool) private leaderboardRegistered;

    mapping(uint256 => mapping(address => bool)) public rematchVotes;

    event RoomCreated(uint256 indexed roomId, address roomContract, address indexed owner, uint96 stake);
    event RoomJoined(uint256 indexed roomId, address indexed challenger);
    event MatchFinalized(uint256 indexed roomId, address winner, uint8 resultCode);
    event PointsUpdated(address indexed player, uint64 newPoints);
    event RematchRequested(uint256 indexed roomId, address indexed player);
    event RematchReady(uint256 indexed roomId);

    error InvalidStake();
    error InvalidState();
    error Unauthorized();
    error AlreadyVoted();

    modifier onlyRoom(uint256 roomId) {
        if (msg.sender != rooms[roomId].contractAddress) revert Unauthorized();
        _;
    }

    function createRoom(
        uint96 stake,
        uint32 moveTimeout,
        uint32 rematchWindow,
        bool rankingEnabled
    ) external payable returns (uint256 roomId, address room) {
        if (stake == 0) revert InvalidStake();
        if (msg.value != stake) revert InvalidStake();

        roomId = ++roomCounter;

        CipherClash clash = new CipherClash(
            address(this),
            msg.sender,
            stake,
            moveTimeout,
            rematchWindow
        );

        rooms[roomId] = RoomInfo({
            contractAddress: address(clash),
            playerA: msg.sender,
            playerB: address(0),
            stake: stake,
            rankingEnabled: rankingEnabled,
            completed: false
        });

        _registerLeaderboardMember(msg.sender);

        emit RoomCreated(roomId, address(clash), msg.sender, stake);
        room = address(clash);
    }

    function joinRoom(uint256 roomId) external payable {
        RoomInfo storage room = rooms[roomId];
        if (room.contractAddress == address(0) || room.completed) revert InvalidState();
        if (room.playerB != address(0)) revert InvalidState();
        if (msg.value != room.stake) revert InvalidStake();

        room.playerB = msg.sender;
        CipherClash(room.contractAddress).join(msg.sender);
        _registerLeaderboardMember(msg.sender);

        emit RoomJoined(roomId, msg.sender);
    }

    function finalizeMatch(uint256 roomId) external {
        RoomInfo storage room = rooms[roomId];
        if (room.contractAddress == address(0) || room.completed) revert InvalidState();

        CipherClash clash = CipherClash(room.contractAddress);
        if (clash.state() != CipherClash.RoomState.Resolved) revert InvalidState();

        address winner = clash.winner();
        uint8 resultCode = clash.lastResultPlaintext();

        // 资金结算
        uint96 totalStake = room.stake * 2;
        if (winner == address(0)) {
            // 平局：双方退回押注
            _safeTransfer(room.playerA, room.stake);
            _safeTransfer(room.playerB, room.stake);
        } else {
            _safeTransfer(winner, totalStake);
        }

        _updateStats(room.playerA, room.playerB, resultCode, room.rankingEnabled);

        clash.markCompleted();
        room.completed = true;

        emit MatchFinalized(roomId, winner, resultCode);
    }

    function requestRematch(uint256 roomId) external {
        RoomInfo storage room = rooms[roomId];
        if (room.contractAddress == address(0) || !room.completed) revert InvalidState();
        if (msg.sender != room.playerA && msg.sender != room.playerB) revert Unauthorized();
        if (rematchVotes[roomId][msg.sender]) revert AlreadyVoted();

        rematchVotes[roomId][msg.sender] = true;
        emit RematchRequested(roomId, msg.sender);

        if (rematchVotes[roomId][room.playerA] && rematchVotes[roomId][room.playerB]) {
            // 需要双方再次存入押注
            rematchVotes[roomId][room.playerA] = false;
            rematchVotes[roomId][room.playerB] = false;
            room.completed = false;
            // 资金在复赛前由 create/join 流程重新注入
            CipherClash(room.contractAddress).resetForRematch();
            emit RematchReady(roomId);
        }
    }

    function reportTimeoutWin(uint256 roomId) external {
        RoomInfo storage room = rooms[roomId];
        if (room.contractAddress == address(0)) revert InvalidState();
        if (msg.sender != room.playerA && msg.sender != room.playerB) revert Unauthorized();

        CipherClash clash = CipherClash(room.contractAddress);
        clash.forceResolve();
    }

    function getRoomInfo(uint256 roomId) external view returns (RoomInfo memory info) {
        info = rooms[roomId];
    }

    function getLeaderboard(uint256 limit) external view returns (LeaderboardEntry[] memory entries) {
        uint256 memberCount = leaderboardMembers.length;
        if (limit == 0 || limit > memberCount) {
            limit = memberCount;
        }

        entries = new LeaderboardEntry[](memberCount);
        for (uint256 i = 0; i < memberCount; i++) {
            address player = leaderboardMembers[i];
            PlayerStats memory s = stats[player];
            entries[i] = LeaderboardEntry({
                player: player,
                points: s.points,
                wins: s.wins,
                losses: s.losses,
                ties: s.ties
            });
        }

        // 简单选择排序，按积分降序
        for (uint256 i = 0; i < memberCount; i++) {
            uint256 maxIndex = i;
            for (uint256 j = i + 1; j < memberCount; j++) {
                if (entries[j].points > entries[maxIndex].points) {
                    maxIndex = j;
                }
            }
            if (maxIndex != i) {
                LeaderboardEntry memory temp = entries[i];
                entries[i] = entries[maxIndex];
                entries[maxIndex] = temp;
            }
        }

        if (limit < memberCount) {
            LeaderboardEntry[] memory trimmed = new LeaderboardEntry[](limit);
            for (uint256 i = 0; i < limit; i++) {
                trimmed[i] = entries[i];
            }
            return trimmed;
        }

        return entries;
    }

    function _updateStats(
        address playerA,
        address playerB,
        uint8 resultCode,
        bool rankingEnabled
    ) internal {
        if (!rankingEnabled) {
            return;
        }

        PlayerStats storage statsA = stats[playerA];
        PlayerStats storage statsB = stats[playerB];

        if (resultCode == uint8(CipherClash.MatchResult.PlayerAWin)) {
            statsA.wins += 1;
            statsA.points += 3;
            statsB.losses += 1;
        } else if (resultCode == uint8(CipherClash.MatchResult.PlayerBWin)) {
            statsB.wins += 1;
            statsB.points += 3;
            statsA.losses += 1;
        } else {
            statsA.ties += 1;
            statsB.ties += 1;
            statsA.points += 1;
            statsB.points += 1;
        }

        emit PointsUpdated(playerA, statsA.points);
        emit PointsUpdated(playerB, statsB.points);
    }

    function _safeTransfer(address to, uint96 amount) internal {
        (bool ok, ) = to.call{ value: amount }("");
        require(ok, "TRANSFER_FAIL");
    }

    function _registerLeaderboardMember(address player) internal {
        if (!leaderboardRegistered[player]) {
            leaderboardRegistered[player] = true;
            leaderboardMembers.push(player);
        }
    }
}
