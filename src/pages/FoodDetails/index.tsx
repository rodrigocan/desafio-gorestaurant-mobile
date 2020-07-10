import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image, Alert } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const { data: foodData } = await api.get<Food>(`foods/${routeParams.id}`);

      setFood({
        ...foodData,
        formattedPrice: formatValue(foodData.price),
      });

      const formattedExtras = foodData.extras.map(extra => {
        return {
          ...extra,
          quantity: 0,
        };
      });

      setExtras(formattedExtras);

      const { data: favorites } = await api.get<Food[]>('favorites');

      const checkIsFavorite = favorites.find(
        favorite => favorite.id === routeParams.id,
      );

      setIsFavorite(!!checkIsFavorite);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    setExtras(
      extras.map(extra => {
        if (extra.id === id) {
          return {
            ...extra,
            quantity: extra.quantity + 1,
          };
        }

        return extra;
      }),
    );
  }

  function handleDecrementExtra(id: number): void {
    setExtras(
      extras.map(extra => {
        if (extra.id === id) {
          return {
            ...extra,
            quantity: extra.quantity > 0 ? extra.quantity - 1 : extra.quantity,
          };
        }

        return extra;
      }),
    );
  }

  function handleIncrementFood(): void {
    setFoodQuantity(oldState => oldState + 1);
  }

  function handleDecrementFood(): void {
    foodQuantity > 1 && setFoodQuantity(oldState => oldState - 1);
  }

  const toggleFavorite = useCallback(async () => {
    async function addFavorite(): Promise<void> {
      try {
        await api.post('favorites', food);

        setIsFavorite(true);
      } catch (error) {
        Alert.alert('Ocorreu um erro de conexão. Tente novamente.');
      }
    }

    async function deleteFavorite(): Promise<void> {
      try {
        await api.delete(`favorites/${food.id}`);

        setIsFavorite(false);
      } catch (error) {
        Alert.alert('Ocorreu um erro de conexão. Tente novamente.');
      }
    }

    isFavorite ? await deleteFavorite() : await addFavorite();
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const extrasTotal = extras.reduce((accumulator, extra) => {
      const subtotal = extra.value * extra.quantity;
      return accumulator + subtotal;
    }, 0);

    return formatValue(foodQuantity * food.price + extrasTotal);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    try {
      await api.post('orders', {
        ...food,
        product_id: food.id,
        extras,
      });

      Alert.alert('Pedido realizado com sucesso!');
    } catch (error) {
      Alert.alert('Ocorreu um erro de conexão. Tente novamente.');
    }
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
