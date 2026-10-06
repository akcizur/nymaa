#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "NymaaPlayerController.generated.h"

class ANymaaPlayerPawn;
class ANymaaCarPawn;
class UNymaaTouchWidget;

UCLASS()
class NYMAA_API ANymaaPlayerController : public APlayerController
{
    GENERATED_BODY()

public:
    ANymaaPlayerController();

    virtual void BeginPlay() override;
    virtual void SetupInputComponent() override;
    virtual void InputTouch(
        uint32 Handle,
        ETouchType::Type Type,
        const FVector2D& TouchLocation,
        float Force,
        FDateTime DeviceTimestamp,
        uint32 TouchpadIndex = 0) override;

    void InitializeNymaa(ANymaaPlayerPawn* InPlayer, ANymaaCarPawn* InCar);

    FVector2D GetMoveInput() const { return MoveInput; }
    bool HasTouchControl() const { return bTouchActive; }

private:
    void MoveForward(float Value);
    void MoveRight(float Value);
    void Interact();

    void UpdateTouchWidget();
    bool IsTouchActionZone(const FVector2D& Position) const;

    UPROPERTY()
    ANymaaPlayerPawn* PlayerPawn = nullptr;

    UPROPERTY()
    ANymaaCarPawn* CarPawn = nullptr;

    UPROPERTY()
    UNymaaTouchWidget* TouchWidget = nullptr;

    FVector2D KeyboardInput = FVector2D::ZeroVector;
    FVector2D MoveInput = FVector2D::ZeroVector;

    FVector2D TouchStart = FVector2D::ZeroVector;
    FVector2D TouchPosition = FVector2D::ZeroVector;

    int32 MoveTouchHandle = INDEX_NONE;
    int32 ActionTouchHandle = INDEX_NONE;

    bool bTouchActive = false;
};
