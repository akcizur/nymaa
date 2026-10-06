#include "NymaaPlayerController.h"

#include "NymaaPlayerPawn.h"
#include "NymaaCarPawn.h"
#include "NymaaTouchWidget.h"

#include "Blueprint/UserWidget.h"
#include "Engine/World.h"

ANymaaPlayerController::ANymaaPlayerController()
{
    bShowMouseCursor = true;
    bEnableTouchEvents = true;
    bEnableClickEvents = true;
}

void ANymaaPlayerController::BeginPlay()
{
    Super::BeginPlay();

    SetInputMode(FInputModeGameOnly());
    bShowMouseCursor = false;

    TouchWidget = CreateWidget<UNymaaTouchWidget>(this, UNymaaTouchWidget::StaticClass());
    if (TouchWidget)
    {
        TouchWidget->AddToViewport(100);
        TouchWidget->SetOwningController(this);
    }
}

void ANymaaPlayerController::InitializeNymaa(ANymaaPlayerPawn* InPlayer, ANymaaCarPawn* InCar)
{
    PlayerPawn = InPlayer;
    CarPawn = InCar;

    if (PlayerPawn)
    {
        Possess(PlayerPawn);
    }

    UpdateTouchWidget();
}

void ANymaaPlayerController::SetupInputComponent()
{
    Super::SetupInputComponent();

    InputComponent->BindAxis(TEXT("MoveForward"), this, &ANymaaPlayerController::MoveForward);
    InputComponent->BindAxis(TEXT("MoveRight"), this, &ANymaaPlayerController::MoveRight);
    InputComponent->BindAction(TEXT("Interact"), IE_Pressed, this, &ANymaaPlayerController::Interact);
}

void ANymaaPlayerController::MoveForward(float Value)
{
    KeyboardInput.X = FMath::Clamp(Value, -1.0f, 1.0f);
    MoveInput = KeyboardInput;
}

void ANymaaPlayerController::MoveRight(float Value)
{
    KeyboardInput.Y = FMath::Clamp(Value, -1.0f, 1.0f);
    MoveInput = KeyboardInput;
}

void ANymaaPlayerController::Interact()
{
    if (!PlayerPawn || !CarPawn)
    {
        return;
    }

    APawn* CurrentPawn = GetPawn();

    if (CurrentPawn == PlayerPawn)
    {
        const float Distance = FVector::Dist2D(PlayerPawn->GetActorLocation(), CarPawn->GetActorLocation());

        if (Distance <= 420.0f)
        {
            PlayerPawn->SetActorHiddenInGame(true);
            PlayerPawn->SetActorEnableCollision(false);

            Possess(CarPawn);
            UpdateTouchWidget();
        }
    }
    else if (CurrentPawn == CarPawn)
    {
        Possess(PlayerPawn);

        const FVector Right = CarPawn->GetActorRightVector();
        PlayerPawn->SetActorLocation(CarPawn->GetActorLocation() + Right * 260.0f, false);

        PlayerPawn->SetActorHiddenInGame(false);
        PlayerPawn->SetActorEnableCollision(true);
        UpdateTouchWidget();
    }
}

void ANymaaPlayerController::InputTouch(
    uint32 Handle,
    ETouchType::Type Type,
    const FVector2D& TouchLocation,
    float Force,
    FDateTime DeviceTimestamp,
    uint32 TouchpadIndex)
{
    Super::InputTouch(Handle, Type, TouchLocation, Force, DeviceTimestamp, TouchpadIndex);

    FVector2D ViewSize;
    GetViewportSize(ViewSize.X, ViewSize.Y);

    const bool bActionZone = IsTouchActionZone(TouchLocation);

    if (Type == ETouchType::Began)
    {
        if (bActionZone && ActionTouchHandle == INDEX_NONE)
        {
            ActionTouchHandle = static_cast<int32>(Handle);
            Interact();
            return;
        }

        if (TouchLocation.X < ViewSize.X * 0.55f && MoveTouchHandle == INDEX_NONE)
        {
            MoveTouchHandle = static_cast<int32>(Handle);
            TouchStart = TouchLocation;
            TouchPosition = TouchLocation;
            bTouchActive = true;
        }
    }
    else if (Type == ETouchType::Moved)
    {
        if (static_cast<int32>(Handle) == MoveTouchHandle)
        {
            TouchPosition = TouchLocation;

            FVector2D Delta = (TouchPosition - TouchStart) / 140.0f;
            Delta.X = FMath::Clamp(Delta.X, -1.0f, 1.0f);
            Delta.Y = FMath::Clamp(Delta.Y, -1.0f, 1.0f);

            if (Delta.SizeSquared() > 1.0f)
            {
                Delta.Normalize();
            }

            MoveInput = FVector2D(Delta.Y, Delta.X);
        }
    }
    else if (Type == ETouchType::Ended || Type == ETouchType::Cancelled)
    {
        if (static_cast<int32>(Handle) == MoveTouchHandle)
        {
            MoveTouchHandle = INDEX_NONE;
            MoveInput = FVector2D::ZeroVector;
            bTouchActive = false;
        }

        if (static_cast<int32>(Handle) == ActionTouchHandle)
        {
            ActionTouchHandle = INDEX_NONE;
        }
    }
}

bool ANymaaPlayerController::IsTouchActionZone(const FVector2D& Position) const
{
    FVector2D ViewSize;
    GetViewportSize(ViewSize.X, ViewSize.Y);

    return Position.X > ViewSize.X - 170.0f && Position.Y > ViewSize.Y - 170.0f;
}

void ANymaaPlayerController::UpdateTouchWidget()
{
    if (!TouchWidget)
    {
        return;
    }

    const bool bDriving = GetPawn() == CarPawn;
    bool bCanInteract = false;

    if (PlayerPawn && CarPawn && !bDriving)
    {
        bCanInteract = FVector::Dist2D(
            PlayerPawn->GetActorLocation(),
            CarPawn->GetActorLocation()) <= 420.0f;
    }

    TouchWidget->SetState(bDriving, bCanInteract, bTouchActive, TouchStart, TouchPosition);
}
