# Mechanics

## Game

<!-- subgraph Round
    startRound{{Start Round}} -.-> blackbox{{???}}
    blackbox -.-> liveLost
    blackbox -.-> roundWon
    liveLost{{Live Lost!}}
    roundWon{{Round Won!}}
end -->
```mermaid
flowchart TD

subgraph Game
    startGame([Start Game]) --> loadLevel[Load Level]
    loadLevel --> startRound[[Start Round]]
    startRound --> roundWon{RoundWon?}
    
    roundWon --> |no| decreaseLife[Decrease Life]
    decreaseLife --> lifeLeft{Any Lifes Left?}
    
    lifeLeft --> |yes| startRound

    lifeLeft --> |no| gameOver([Game Over!])
    

    roundWon --> |yes| levelLeft{Any Level Left?}
    levelLeft --> |no| gameWon([Game Won!])

    levelLeft --> |yes| increaseLevel[Increase Level]
    increaseLevel --> |yes| loadLevel
end
```

## Round

```mermaid
flowchart TD
subgraph Round
    startRound(["Start Round"]) --> startSequence[["Start Sequence"]]
    startSequence --> move[Move]

    move --> collides{Collides?}
    collides --> |no| move
    
    collides --> |Wall| roundLost
    collides --> |Worm| roundLost
    roundLost[RoundLost] --> endRound([End Round])

    collides --> |Target| incTargetCount[Increase Target Count]
    incTargetCount --> targetsLeft{Any more targets?}
    targetsLeft --> |no| openExit
    openExit["Open Exit"] --> move
    collides ---> |Exit| roundWon[Round Won!]
    targetsLeft --> |yes| showNextTarget[Show Next Target]
    showNextTarget --> |yes| move
    roundWon --> endRound
end
```