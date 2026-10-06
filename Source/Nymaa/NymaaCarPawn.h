#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Pawn.h"
#include "NymaaCarPawn.generated.h"

class UBoxComponent;
class UStaticMeshComponent;
class USpringArmComponent;
class UCameraComponent;

UCLASS()
class NYMAA_API ANymaaCarPawn : public APawn
{
    GENERATED_BODY()

public:
    ANymaaCarPawn();

    virtual void Tick(float DeltaSeconds) override;

private:
    void AddWheel(const FName Name, const FVector& Location);

    UPROPERTY(VisibleAnywhere)
    UBoxComponent* Collision = nullptr;

    UPROPERTY(VisibleAnywhere)
    UStaticMeshComponent* Body = nullptr;

    UPROPERTY(VisibleAnywhere)
    UStaticMeshComponent* Cabin = nullptr;

    UPROPERTY(VisibleAnywhere)
    UStaticMeshComponent* WheelsRoot = nullptr;

    UPROPERTY(VisibleAnywhere)
    USpringArmComponent* CameraBoom = nullptr;

    UPROPERTY(VisibleAnywhere)
    UCameraComponent* Camera = nullptr;

    float Speed = 0.0f;
};
