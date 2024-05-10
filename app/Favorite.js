import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Toast, AlertNotificationRoot, ALERT_TYPE } from 'react-native-alert-notification';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import * as Font from 'expo-font';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { collection, addDoc, getDocs, getDoc, setDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { FIREBASE_AUTH, db } from './FirebaseConfig';
import { ScrollView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const FavoriteScreen = () => {

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const [cartTotal, setCartTotal] = useState(0);

    useEffect(() => {
        // Load cart items from Firestore when component mounts
        const currentUser = FIREBASE_AUTH.currentUser;

        if (currentUser) {
            const { uid } = currentUser;
            const cartRef = doc(db, "carts", uid);

            const unsubscribe = onSnapshot(cartRef, (cartDoc) => {
                if (cartDoc.exists()) {
                    const cartData = cartDoc.data();
                    // Calculate the total quantity of items in the cart
                    const totalQty = cartData.items.reduce((acc, item) => {
                        return acc + item.quantity;
                    }, 0);
                    setCartTotal(totalQty);
                }
            }, (error) => {
                console.error("Error getting cart document: ", error);
            });

            return unsubscribe;
        }
    }, []);

    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        const currentUser = FIREBASE_AUTH.currentUser;

        if (currentUser) {
            const { uid } = currentUser;
            const cartRef = doc(db, "fav", uid);

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


    const navigation = useNavigation();

    const handleProductPress = (product) => {
        router.push({ pathname: 'Details', params: product });
    }


    const removeItemFromCart = (itemId) => {
        const updatedCartItems = cartItems.filter(item => item.id !== itemId);
        const currentUser = FIREBASE_AUTH.currentUser;

        if (currentUser) {
            const { uid } = currentUser;
            const cartRef = doc(db, "fav", uid);

            updateDoc(cartRef, { items: updatedCartItems })
                .then(() => {
                    setCartItems(updatedCartItems);
                })
                .catch((error) => {
                    console.error("Error removing item from cart: ", error);
                });
        }
    }
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPrice, setSelectedPrice] = useState(null);




    return (
        <>
            <ScrollView style={{
                backgroundColor: '#F5F8FA',

            }}>

                <View style={styles.container}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#1DA1F2" style={{ marginTop: '50%' }} />
                    ) : (
                        <View style={styles.productListContainer}>
                            {products.filter((product) => {
                                return cartItems.some((cartItem) => {
                                    return cartItem.id === product.id
                                })
                            }).length === 0 ? (
                                <View style={styles.noResultsContainer}>
                                    <Text style={styles.noResultsText}>you dont have any Favorite products.</Text>
                                    <Image style={styles.image1} source={require('./lol.png')} resizeMode='contain'></Image>

                                </View>
                            ) : (
                                products.filter((product) => {
                                    return cartItems.some((cartItem) => {
                                        return cartItem.id === product.id
                                    })
                                }).map(item => (
                                    <>
                                        {item.quantity > 0 ? (

                                            <View key={item.id} style={styles.productCard}>
                                                <Image style={styles.productImageContainer} source={{ uri: item.image }} >
                                                </Image>
                                                {item.offer ? (
                                                    <Text style={styles.productPrice}>${item.offer}</Text>
                                                ) : (
                                                    <Text style={styles.productPrice}>${item.price}</Text>)}
                                                <Text style={styles.productPrice2} onPress={() => removeItemFromCart(item.id)}>Remove</Text>

                                                <View style={styles.productDetails}>
                                                    <Text style={styles.productName}>{item.name}</Text>
                                                </View>
                                                <View style={styles.addToCartButtonContainer}>
                                                    <TouchableOpacity style={styles.iconButton} onPress={() => handleProductPress(product)}>
                                                        <FontAwesome name="info-circle" size={24} color="#FFFFFF" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity style={[styles.iconButton, styles.addButton]} onPress={() => handleAddToCart(product)}>
                                                        <FontAwesome name="cart-plus" size={24} color="#FFFFFF" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ) : (

                                            <View key={item.id} style={styles.productCard}>
                                                <Image style={styles.productImageContainer} source={{ uri: item.image }} >
                                                </Image>
                                                <Text style={styles.productPrice}>${item.price}</Text>
                                                <Text style={styles.productPrice2} onPress={() => removeItemFromCart(item.id)}>Remove</Text>

                                                <View style={styles.productDetails}>
                                                    <Text style={styles.productName}>{item.name}</Text>
                                                </View>
                                                <View style={{
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    padding: 10
                                                }}>
                                                    <Text style={styles.test}>Out of stock!</Text>


                                                </View>
                                            </View>
                                        )}
                                    </>
                                ))
                            )}
                        </View>
                    )}
                </View>
            </ScrollView >
            <TouchableOpacity style={styles.cartIconContainer} onPress={() => navigation.navigate('Cart')} >
                <Feather name="shopping-cart" size={30} color="#fff" />
                {cartTotal > 0 && (
                    <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{cartTotal}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F8FA',
        padding: 40,

    }, categoriesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    image1: {
        alignSelf: 'center',
        marginTop: 60,
        height: 340,
        width: 300
    },

    noResultsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noResultsText: {
        fontSize: 16,
        fontFamily: 'SunshineRegular',
        color: '#657786',
    },
    test: {
        fontFamily: 'SunshineRegular',
        alignSelf: 'center',
        fontSize: 16,
        color: '#657786',
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
        fontSize: 14,
        color: '#657786',
        position: 'absolute',
        padding: 5,
        fontFamily: 'SunshineRegular',
        backgroundColor: '#E1E8ED',
        borderRadius: 10,
        margin: 5,

    },
    productPrice2: {
        fontSize: 14,
        color: '#657786',
        position: 'absolute',
        margin: 5,
        padding: 5,
        backgroundColor: '#E1E8ED',

        borderRadius: 10,
        right: 0,
        fontFamily: 'SunshineRegular',

    },

    cartBadge: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: '#1DA1F2',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },

    cartBadgeText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },
    noReviewsText: {
        fontFamily: "SunshineRegular",
        fontSize: 16,
        textAlign: "center",
        marginTop: 10,
        color: "#657786",
    },
    cartIconContainer: {
        position: 'absolute',
        bottom: 40,
        paddingRight: 2,
        right: 34,
        backgroundColor: '#657786',
        borderRadius: 50,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        elevation: 5,
        borderColor: '#fff', // Add the borderColor property
        borderWidth: 0.2
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

});

export default FavoriteScreen;