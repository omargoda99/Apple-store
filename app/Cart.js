import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, StyleSheet, } from 'react-native';
import { ALERT_TYPE, Dialog, AlertNotificationRoot, Toast } from 'react-native-alert-notification';
import { Feather } from '@expo/vector-icons';
import { collection, getDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db,FIREBASE_AUTH } from '../../../../../cs303/final/mine/FirebaseConfig';
import { router } from 'expo-router';


const CartScreen = () => {


  const [products, setProducts] = useState([]);

  // create an async function to get the products data from Firestore and update the state
  function getProducts() {
    const productsRef = collection(db, "products");
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const productsData = [];

      snapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() });
      });

      // check if any cart items have 0 quantity due to out of stock products
      const currentUser = FIREBASE_AUTH.currentUser;

      if (currentUser) {
        const { uid } = currentUser;
        const cartRef = doc(db, "carts", uid);

        getDoc(cartRef)
          .then((cartDoc) => {
            if (cartDoc.exists()) {
              const cartData = cartDoc.data();

              const removedItems = [];
              const updatedCartItems = cartData.items.filter((item) => {
                const product = productsData.find((p) => p.id === item.id);
                if (product && product.quantity === 0) {
                  removedItems.push(product.name);
                  return false;
                }
                return true;
              });

              if (removedItems.length > 0) {
                Alert.alert(`Items '${removedItems.join(", ")}' removed`, ' due to being out of stock.');
              }

              updateDoc(cartRef, { items: updatedCartItems })
                .catch((error) => {
                  console.error("Error updating cart items after removing out of stock items: ", error);
                });

              setCartItems(updatedCartItems);
            }
          })
          .catch((error) => {
            console.error("Error getting cart document: ", error);
          });
      }

      setProducts(productsData);
    }, (error) => {
      console.error("Error getting products from Firestore: ", error);
    });

    return unsubscribe;
  }

  // call the getProducts function to get the products data when the component mounts
  useEffect(() => {
    const unsubscribe = getProducts();

    return () => {
      unsubscribe();
    };
  }, []);


  
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const currentUser = FIREBASE_AUTH.currentUser;

    if (currentUser) {
      const { uid } = currentUser;
      const cartRef = doc(db, "carts", uid);

      const unsubscribe = onSnapshot(cartRef, (cartDoc) => {
        if (cartDoc.exists()) {
          const cartData = cartDoc.data();
          setCartItems(cartData.items);
        }
      }, (error) => {
        console.error("Error getting cart document: ", error);
      });

      return () => unsubscribe();
    }
  }, []);
  const removeItemFromCart = (itemId) => {
    const updatedCartItems = cartItems.filter(item => item.id !== itemId);
    const currentUser = FIREBASE_AUTH.currentUser;

    if (currentUser) {
      const { uid } = currentUser;
      const cartRef = doc(db, "carts", uid);

      updateDoc(cartRef, { items: updatedCartItems })
        .then(() => {
          setCartItems(updatedCartItems);
        })
        .catch((error) => {
          console.error("Error removing item from cart: ", error);
        });
    }
  }

  const incrementQuantity = (itemId) => {
    const product = products.find(p => p.name === itemId);
    let isMaxQuantity = false; // added variable
    
    const updatedCartItems = cartItems.map(item => {
        if (item.name === itemId && item.quantity < 10 && item.quantity < product.quantity) {
            return { ...item, quantity: item.quantity + 1 };
        } else if (item.name === itemId) {
            isMaxQuantity = true; // if the item has reached its maximum quantity, set isMaxQuantity to true
        }
        return item;
    });

    if (isMaxQuantity) { // show the Toast if isMaxQuantity is true
        Toast.show({
            type: ALERT_TYPE.WARNING,
            textBody: 'item already has the maximum quantity in cart.',
            autoClose: 2000,
            titleStyle: {
                fontFamily: "SunshineRegular",
                color: '#657786',
            },
            textBodyStyle: {
                fontFamily: "SunshineRegular",
                color: '#657786',
            },
        });
        return; // exit the function if isMaxQuantity is true
    }

    const currentUser = FIREBASE_AUTH.currentUser;

    if (currentUser) {
        const { uid } = currentUser;
        const cartRef = doc(db, "carts", uid);

        updateDoc(cartRef, { items: updatedCartItems })
            .then(() => {
                setCartItems(updatedCartItems);
            })
            .catch((error) => {
                console.error("Error updating cart item quantity: ", error);
            });
    }
}

  const decrementQuantity = (itemId) => {
    const updatedCartItems = cartItems.map(item => {
      if (item.id === itemId && item.quantity > 1) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    });
    const currentUser = FIREBASE_AUTH.currentUser;

    if (currentUser) {
      const { uid } = currentUser;
      const cartRef = doc(db, "carts", uid);

      updateDoc(cartRef, { items: updatedCartItems })
        .then(() => {
          setCartItems(updatedCartItems);
        })
        .catch((error) => {
          console.error("Error updating cart item quantity: ", error);
        });
    }
  }

  const removeAllItemsFromCart = () => {
    const currentUser = FIREBASE_AUTH.currentUser;

    if (currentUser) {
      const { uid } = currentUser;
      const cartRef = doc(db, "carts", uid);

      updateDoc(cartRef, { items: [] })
        .then(() => {
          setCartItems([]);
        })
        .catch((error) => {
          console.error("Error removing all items from cart: ", error);
        });
    }
  }

  const totalItems = cartItems.reduce((acc, item) => {
    return acc + item.quantity;
  }, 0);

  const totalPrice = cartItems.reduce((acc, item) => {
    let itemTotal = item.quantity * item.price;
    if (item.quantity >= 2) {
      itemTotal *= 0.9; // apply 10% discount to items with quantity 2 or more
    }
    return acc + itemTotal;
  }, 0);


  const goToCheckout = () => {
   router.push('Cheakout')
  }

  return (
    <View style={styles.container}>
      <AlertNotificationRoot>
        <ScrollView contentContainerStyle={styles.scrollview}>
          <Text style={[styles.noitems, { fontSize: 20, marginBottom: 30 }]}>You have <Text style={{ color: "#1DA1F2" }}>{totalItems}</Text> products in your cart.</Text>

          {cartItems.length === 0 ?
            <>
              <Text style={styles.noitems}>Your cart is empty</Text>
              <Image style={styles.image1} source={require('./lol.png')} resizeMode='contain'></Image>
            </>

            :
            <>

              {cartItems.map(item => (

                <>
                  <View key={item.id} style={styles.item}>
                    <Image source={{ uri: item.image }} style={styles.image} />
                    <View style={styles.details}>
                      <Text style={styles.title}>{item.name} </Text>
                      <Text style={styles.price}>
                        ${item.quantity > 1 ? item.price - item.price * 0.1 :
                          item.price}
                      </Text>
                      <TouchableOpacity onPress={() => removeItemFromCart(item.id)}>
                        <Text style={styles.removeButton}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity onPress={() => decrementQuantity(item.id)}>
                        <Feather name="minus" size={18} color="#657786" />
                      </TouchableOpacity>
                      <Text style={styles.quantity}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => incrementQuantity(item.name)}>
                        <Feather name="plus" size={18} color="#657786" />
                      </TouchableOpacity>
                      <Text style={styles.note}>{item.quantity >= 2 && `10% discount applied`}</Text>

                    </View>

                  </View>
              
                </>

              ))}
                  <TouchableOpacity style={styles.removeallButton} onPress={removeAllItemsFromCart}>
                    <Text style={styles.removeallButtonText}>Remove all items from cart</Text>
                  </TouchableOpacity>
            </>

          }

        </ScrollView>

        {cartItems.length > 0 && (
          <View style={{
            padding: 20,
            backgroundColor: 'white',
            borderRadius: 10,
            elevation: 5
          }}>
            <Text style={styles.total}>Total price is <Text style={{ color: '#1DA1F2' }}>${totalPrice.toFixed(2)} </Text>!</Text>
            <View style={{
              borderTopWidth: 0.5,
              borderTopColor: '#657786',
            }}>
              <TouchableOpacity style={styles.checkoutButton} onPress={goToCheckout}>
                <Text style={styles.checkoutButtonText}>Go to checkout</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}
      </AlertNotificationRoot>
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F8FA',
  },
  scrollview: {
    flexGrow: 1,
    backgroundColor: '#F5F8FA',
    paddingBottom: 50,
  },
  noitems: {
    fontFamily: "SunshineRegular",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    color: "#657786",
  },
  image1: {
    alignSelf: 'center',
    marginTop: 60,
    height: 340,
    width: 300
  },
  total: {
    fontFamily: "SunshineRegular",
    fontSize: 20,
    marginBottom: 10,
    color: "#657786",
  },
  title: {
    fontFamily: "SunshineRegular",
    fontSize: 20,
    alignSelf: 'center',
    marginBottom: 10,
    color: "#657786",
  },
  note: {
    position: 'absolute',
    fontFamily: "SunshineRegular",
    fontSize: 12,
    color: "#1DA1F2",
    top: '-30%',
    right: '10%'
  },

  removeButton: {
    fontFamily: 'SunshineRegular',
    fontSize: 16,
    color: '#657786',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#E1E8ED',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 0.1 },
    shadowOpacity: 1.5,
    shadowRadius: 1.84,
    elevation: 1,
  },
  image: {
    width: '35%',
    height: '100%',
    resizeMode: 'stretch'

  },
  details: {
    flex: 1,
    padding: 10,
    backgroundColor: '#E1E8ED',

  },
  title: {
    fontSize: 15,
    fontFamily: 'SunshineRegular',
    marginBottom: 10,
    color: '#657786',
  },
  price: {
    fontSize: 16,
    fontFamily: 'SunshineRegular',
    marginBottom: 10,
    color: "#1DA1F2"
  },
  checkoutButton: {
    marginTop: 15,
    backgroundColor: '#657786',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'center',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    textAlign: 'center',
    fontFamily: 'SunshineRegular',
  },
  removeallButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 9999,
    paddingVertical: 10,
    width: '70%',
    alignSelf: 'center',
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: '#E1E8ED',
  },
  removeallButtonText: {
    color: '#657786',
    fontFamily: 'SunshineRegular',
    fontSize: 13,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    backgroundColor: '#E1E8ED',

  },
  quantity: {
    fontSize: 20,
    fontFamily: 'SunshineRegular',
    marginHorizontal: 10,
    color: '#1DA1F2',
    backgroundColor: '#E1E8ED',

  },
})

export default CartScreen;