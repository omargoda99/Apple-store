import React from 'react';
import { onSnapshot } from 'firebase/firestore';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView, LogBox } from 'react-native';
import { ALERT_TYPE, Dialog, AlertNotificationRoot, Toast } from 'react-native-alert-notification';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { collection, addDoc, getDocs, getDoc, setDoc, doc, updateDoc } from 'firebase/firestore';
import { FIREBASE_AUTH, db } from '../FirebaseConfig';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';



const TabOneScreen = () => {
  LogBox.ignoreAllLogs()


  const [loading, setLoading] = useState(true);


  function handleAddToCart(product) {
    const currentUser = FIREBASE_AUTH.currentUser;

    if (currentUser) {
      const { uid } = currentUser;
      let newPrice;
      if (product.offer) {
        newPrice = Number(product.offer);
      } else {
        newPrice = product.price
      }
      const cartItem = { id: product.id, name: product.name, image: product.image, price: newPrice, quantity: 1, Ava: product.quantity };

      const cartRef = doc(db, "carts", uid);
      getDoc(cartRef).then((cartDoc) => {
        if (cartDoc.exists()) {
          const cartData = cartDoc.data();
          const existingItemIndex = cartData.items.findIndex((item) => item.id === cartItem.id);
          if (existingItemIndex > -1) {
            // Item already exists in cart, update its quantity
            const updatedItems = [...cartData.items];

            if (updatedItems[existingItemIndex].quantity < 10 && updatedItems[existingItemIndex].quantity < product.quantity) {
              updatedItems[existingItemIndex].quantity += 1;
              updateDoc(cartRef, { items: updatedItems });
            } else {
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
            }
          } else {
            // Item doesn't exist in cart, add it
            const updatedItems = [...cartData.items, cartItem];
            updateDoc(cartRef, { items: updatedItems });
          }
        } else {
          // Cart doesn't exist, create it
          setDoc(cartRef, { items: [cartItem] });
        }
      }).catch((error) => {
        console.error("Error getting cart document: ", error);
      });

    }
    Toast.show({
      type: ALERT_TYPE.SUCCESS,
      textBody: `${product.name} added to cart.`,
      autoClose: 500,
      titleStyle: {
        fontFamily: "SunshineRegular",
        color: '#657786',

      },
      textBodyStyle: {
        fontFamily: "SunshineRegular",
        color: '#657786',
      },

    })
  }


  const [products, setProducts] = useState([]);

  // create an async function to get the products data from Firestore and update the state
  function getProducts() {
    const productsRef = collection(db, "products"); // create a reference to the "products" collection
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const productsData = []; // create an empty array to hold the products data
      snapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() }); // add each document to the productsData array as an object with the document ID and data
      });
      setProducts(productsData); // update the state with the products data
      setLoading(false)
    }, (error) => {
      console.error("Error getting products from Firestore: ", error); // log any errors
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


  const handleProductPress = (product) => {
    router.push({ pathname: '/Details', params: product });
  }


  const renderProductCard = (product) => {
    return (
      <>
        {product.quantity > 0 ? (
          <View key={product.id} style={styles.productCard}>
            <Image style={styles.productImageContainer} source={{ uri: product.image ? product.image : product.images[0] }} />

            {product.offer ? (
              <>
                <Text style={styles.oldPrice}>${product.price}</Text>
                <Text style={styles.productPrice2}>${product.offer}</Text>
              </>
            ) : (
              <Text style={styles.productPrice}>${product.price}</Text>
            )
            }

            <View style={styles.productDetails}>
              <Text style={styles.productName}>{product.name}</Text>
            </View>
            <View style={styles.addToCartButtonContainer}>
              <TouchableOpacity style={styles.iconButton} onPress={() => handleProductPress(product)}>
                <FontAwesome name="info-circle" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, styles.addButton]} onPress={() => handleAddToCart(product)}>
                <FontAwesome name="cart-plus" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View >
        ) : (
          <View key={product.id} style={styles.productCard}>
            <Image style={styles.productImageContainer} source={{ uri: product.image }} >
            </Image>
            {product.offer ? (
              <>
                <Text style={styles.oldPrice}>${product.price}</Text>
                <Text style={[styles.productPrice2]}>${product.offer}</Text>
              </>
            ) : (
              <Text style={styles.productPrice}>${product.price}</Text>
            )
            }

            <View style={styles.productDetails}>
              <Text style={styles.productName}>{product.name}</Text>
            </View>
            <View style={{
              flexDirection: 'column',
              alignItems: 'center',
              padding: 10
            }}>
              <Text style={styles.test}>Out of stock!</Text>

            </View>
          </View >
        )
        }
      </>
    )

  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Welcome to <Text style={{ fontFamily: 'SunshineRegular', fontSize: 15 }}><Text style={{ color: "#1DA1F2", fontSize: 20 }}>Apple</Text>Store</Text> <Text style={{ fontSize: 18, color: "#657786", fontFamily: 'SunshineRegular' }}>{'\n'} since 2023</Text></Text>
        <Text style={styles.niceWords}>Discover our latest products and find the perfect device for you.</Text>
      </View>

      <View style={styles.categoriesContainer2}>

        <Text style={styles.niceWords2}>
          Unlock up to <Text style={{ color: "#1DA1F2", fontSize: 18 }}>10%</Text> discount
        </Text>
        <Text style={styles.niceWords2}>when purchasing 2 or more of an item!</Text>
      </View >

      <View style={styles.bestSellingContainer}>
        <Text style={styles.bestSellingTitle}>Best Selling</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#1DA1F2" style={{ alignSelf: 'center', height: 100 }} />

        ) : (
          <View style={styles.productListContainer}>

            {products.filter(
              (product) =>
                product.fav == 'yes').map((product) => renderProductCard(product))}
          </View>
        )}

      </View>

      <View style={styles.bestSellingContainer}>
        <Text style={styles.bestSellingTitle}>Offers</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#1DA1F2" style={{ alignSelf: 'center', height: 100 }} />

        ) : (

          <View style={styles.productListContainer}>

            {products.filter(
              (product) =>
                product.offer).map((product) => renderProductCard(product))
            }
          </View>
        )}

        {products.filter(
          (product) => !product.offer).length === products.length && (
            <Text style={styles.noOffersText}>No offers available</Text>
          )}
      </View>

      <Text style={styles.follow}>Follow us on social media</Text>

      <View style={styles.footerContainer}>

        <TouchableOpacity style={styles.socialIcon}>

          <Feather name="facebook" size={24} color="#1DA1F2" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialIcon}>
          <Feather name="twitter" size={24} color="#1DA1F2" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialIcon}>
          <Feather name="instagram" size={24} color="#1DA1F2" />
        </TouchableOpacity>

      </View>
     
    </ScrollView >
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F8FA',
    padding: 40
  },
  welcomeContainer: {
    marginBottom: 30,
    alignSelf: 'center'
  },
  noOffersText: {
    fontFamily: 'SunshineRegular',
    color: '#657786',
    alignSelf: 'center'
  },
  welcomeText: {
    fontSize: 19,
    fontFamily: 'SunshineRegular',
    color: '#657786',

    marginBottom: 10,
  },
  test: {
    fontFamily: 'SunshineRegular',
    alignSelf: 'center',
    fontSize: 16,
    color: '#657786',
  },
  productPrice2: {
    fontSize: 15,
    color: '#657786',
    position: 'absolute',
    margin: 5,
    padding: 5,
    backgroundColor: '#E1E8ED',
    borderRadius: 10,
    fontFamily: 'SunshineRegular',

  },
  oldPrice: {
    fontSize: 18,
    color: '#657786',
    position: 'absolute',
    right: 0,
    padding: 5,
    textDecorationLine: 'line-through', // add this line to cross out the text
    backgroundColor: 'rgba(290, 255, 255, 0.9)',
    borderRadius: 10,
    fontFamily: 'SunshineRegular',
  },
  niceWords: {
    fontSize: 16,
    fontFamily: 'SunshineRegular',
    color: '#657786', //#657800
  },
  niceWords2: {
    fontSize: 14,
    fontFamily: 'SunshineRegular',
    color: '#657786', //#657800
    alignSelf: 'center'
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 12
  },
  categoriesContainer2: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginBottom: 30,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 12
  },
  categoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    width: '30%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: 'SunshineRegular',
    color: '#657786',

  },
  bestSellingContainer: {
    marginBottom: 30,
  },
  bestSellingTitle: {
    fontSize: 20,
    fontFamily: 'SunshineRegular',

    color: '#657786',
    marginBottom: 10,
  },
  follow: {
    fontSize: 20,
    fontFamily: 'SunshineRegular',
    color: '#657786',
    marginBottom: 10,
    alignSelf: 'center'
  },
  productListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    gap: 10
  },
  productCard: {

    backgroundColor: '#E1E8ED',
    borderRadius: 10,
    marginBottom: 20,
    width: '48%',
    height: 290,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0.1 },
    shadowOpacity: 2, // Increase the opacity to make the shadow more visible
    shadowRadius: 3, // Increase the radius to make the shadow larger
    elevation: 3, // Adjust the elevation to fine-tune the shadow
  },
  productImageContainer: {
    height: 190,
    backgroundColor: '#E1E8ED',
    alignItems: 'center',
    justifyContent: 'center',

  },
  productImageText: {
    fontSize: 20,
    fontFamily: 'SunshineRegular',
    color: '#657786',
  },
  productDetails: {
    paddingTop: 10,
    alignItems: 'center'
  },
  productName: {
    fontSize: 18,
    fontFamily: 'SunshineRegular',
    color: '#657786',
  },
  productPrice: {
    fontSize: 15,
    color: '#657786',
    position: 'absolute',
    padding: 5,
    fontFamily: 'SunshineRegular',
    margin: 5,
    backgroundColor: '#E1E8ED',
    borderRadius: 10
  },
  addToCartButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute', // set a fixed position
    bottom: 10, // set the distance from the bottom of the card
    left: 10,
    right: 10,
  },
  iconButton: {
    backgroundColor: '#657786',
    borderRadius: 10,
    padding: 10,
    marginLeft: 8
  },
  addButton: {
    marginRight: 8
  }
  ,
  addToCartButtonText: {
    fontSize: 17,
    fontFamily: 'SunshineRegular',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    paddingBottom:100
  },
  socialIcon: {
    backgroundColor: '#E1E8ED',
    borderRadius: 50,
    width: 50,
    alignSelf: 'center',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#657786',
  },
  auther: {
    color: '#657786',
    fontSize: 20,
    alignSelf: 'center',
    fontFamily: 'SunshineRegular',
  },
});

export default TabOneScreen;