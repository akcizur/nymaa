#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "NymaaGameMode.generated.h"

class ANymaaPlayerPawn;
class ANymaaCarPawn;

UCLASS()
class NYMAA_API ANymaaGameMode : public AGameModeBase
{
    GENERATED_BODY()

public:
    ANymaaGameMode();

    virtual void StartPlay() override;

    ANymaaPlayerPawn* GetPlayerPawn() const { return PlayerPawn; }
    ANymaaCarPawn* GetCarPawn() const { return CarPawn; }

private:
    void BuildCity();
    void SpawnRoad(const FVector& Size, const FVector& Location);
    void SpawnBuilding(const FString& Type, const FVector& Location);

    AActor* SpawnBlock(const FVector& Size, const FVector& Location, const FLinearColor& Color, bool bCollision);

    UPROPERTY()
    ANymaaPlayerPawn* PlayerPawn = nullptr;

    UPROPERTY()
    ANymaaCarPawn* CarPawn = nullptr;
};
