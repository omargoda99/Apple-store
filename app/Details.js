import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { Alert } from 'react-native';
import { onSnapshot } from 'firebase/firestore';
import { ALERT_TYPE, Dialog, AlertNotificationRoot, Toast } from 'react-native-alert-notification';
import { Feather } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp, where, query, getDocs, deleteDoc, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { db,FIREBASE_AUTH } from './FirebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
const ProductPage = () => {

    const [cartTotal, setCartTotal] = useState(0);

    const [hasSubmittedReview, setHasSubmittedReview] = useState(false);

    const [orders, setOrders] = useState([]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // Fetch the user's orders from Firestore
                const currentUser = FIREBASE_AUTH.currentUser;

                if (currentUser) {
                    const { uid } = currentUser;
                    const ordersCollectionRef = collection(db, 'orders');
                    const q = query(ordersCollectionRef, where('userId', '==', uid));

                    // Subscribe to the query snapshot using onsnapshot
                    const unsubscribe = onSnapshot(q, (querySnapshot) => {
                        const userOrders = [];
                        querySnapshot.forEach((doc) => {
                            const orderData = doc.data();
                            userOrders.push(orderData);
                        });
                        userOrders.sort((a, b) => {
                            // Convert the timestamp strings to Date objects
                            const aDate = new Date(a.timestamp);
                            const bDate = new Date(b.timestamp);

                            // Compare the Date objects to sort the orders in descending order
                            if (aDate > bDate) return -1;
                            if (aDate < bDate) return 1;
                            return 0;
                        });
                        setOrders(userOrders);
                    });

                    // Unsubscribe from the query when the component unmounts
                    return () => unsubscribe();
                }
            } catch (error) {
                console.error('Error fetching orders: ', error);
            }
        };

        fetchOrders();
    }, []);

    async function handleReview() {

        if (hasSubmittedReview) {
            Alert.alert('You have already submitted a review for this product.');
            return;
        }
        // Check if the user has purchased the product
        const hasPurchasedProduct = orders.some((order) =>
            order.items.some(
                (item) => item.id === product.id && order.done === 'yes'
            )
        );

        if (!hasPurchasedProduct) {
            Toast.show({
                type: ALERT_TYPE.WARNING,
                textBody: "You need to purchase and receive this item before leaving a review.",
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
            return;
        }

        // Check if the user has already reviewed this product
        const userHasReviewed = reviews.some((review) =>
            review.productId === product.id && review.pass === user.email
        );

        if (userHasReviewed) {
            Toast.show({
                type: ALERT_TYPE.WARNING,
                textBody: "You have already submitted a review for this product.",
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
            return;
        }

        // Proceed with submitting the review if the user has not already reviewed the product
        if (review && rating) {
            try {
                const reviewDocRef = await addDoc(collection(db, "reviews"), {
                    productId: product.id,
                    productName: product.name,
                    name: user.displayName,
                    rating,
                    comment: review,
                    createdAt: new Date().toISOString(),
                    photoUrl: user.photoURL, // Add the user's photo URL 
                    pass: user.email,
                    edit: ''
                });

                Toast.show({
                    type: ALERT_TYPE.SUCCESS,
                    textBody: "Review submitted",
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

                setReviews([
                    ...reviews,
                    {
                        id: reviewDocRef.id,
                        name: user.displayName,
                        rating,
                        comment: review,
                        photoUrl: user.photoURL, // Include the photo URL in the review object
                        pass: user.email,
                        createdAt: new Date().toISOString(),
                        edit: '',
                    },
                ]);
                setReview("");
                setRating(null);
                setHasSubmittedReview(true);

            } catch (error) {
                console.error("Error submitting review: ", error);
                Toast.show({
                    type: ALERT_TYPE.ERROR,
                    textBody: "Error submitting review, please try again later",
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
            Toast.show({
                type: ALERT_TYPE.WARNING,
                textBody: "Please enter a rating and a review.",
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
    }

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

    const [averageRating, setAverageRating] = useState(null);
const product = useLocalSearchParams()
    const [review, setReview] = useState("");
    const [rating, setRating] = useState(null);
    const [reviews, setReviews] = useState([]);

    const navigation = useNavigation();
    const [editReviewId, setEditReviewId] = useState(null);

    function handleCancelEditing() {
        setEditReviewId(null);
        setRating(0);
        setReview("");
    }

    async function handleEditReview(reviewId) {

        setEditReviewId(null);
        setRating(0);
        setReview("");
        if (review && rating) {
            try {
                await updateDoc(doc(db, "reviews", reviewId), {
                    rating,
                    comment: review,
                    edit: 'Edited..'
                });

                const updatedReviews = reviews.map((r) => {
                    if (r.id === reviewId) {
                        return { ...r, rating, comment: review, edit: 'Edited..' };
                    }
                    return r;
                });

                setReviews(updatedReviews);
                setEditReviewId(null);

                Toast.show({
                    type: ALERT_TYPE.SUCCESS,
                    textBody: "Review updated",
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
            } catch (error) {
                console.error("Error updating review: ", error);
                Toast.show({
                    type: ALERT_TYPE.WARNING,
                    textBody: "Error updating review, please try again later",
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
            Toast.show({
                type: ALERT_TYPE.WARNING,
                textBody: "Please enter a rating and a review.",
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
    }


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
                                textBody: `${product.name} already has the maximum quantity in cart.`,
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

    async function addToFavorites(product) {
        const currentUser = FIREBASE_AUTH.currentUser;

        if (currentUser) {
            const { uid } = currentUser;
            const cartItem = { id: product.id, name: product.name, image: product.image, price: product.price };

            const cartRef = doc(db, "fav", uid);
            getDoc(cartRef).then((cartDoc) => {
                if (cartDoc.exists()) {
                    const cartData = cartDoc.data();
                    const existingItemIndex = cartData.items.findIndex((item) => item.id === cartItem.id);

                    if (existingItemIndex > -1) {
                        // Item already exists in cart, update its quantity

                        Toast.show({
                            type: ALERT_TYPE.WARNING,
                            textBody: `${product.name} already in the favorites.`,
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
            textBody: `${product.name} added to favorite.`,
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

    const user = FIREBASE_AUTH.currentUser;



    async function handleDeleteReview(reviewId) {
        try {
            await deleteDoc(doc(db, "reviews", reviewId));
            const updatedReviews = reviews.filter((review) => review.id !== reviewId);
            setReviews(updatedReviews);
            Toast.show({
                type: ALERT_TYPE.SUCCESS,
                textBody: "Review deleted",
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
        } catch (error) {
            console.error("Error deleting review: ", error);
            Toast.show({
                type: ALERT_TYPE.ERROR,
                textBody: "Error deleting review, please try again later",
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
    }
    useEffect(() => {
        // Create a listener for the reviews collection
        const reviewsRef = collection(db, "reviews");
        const reviewsQuery = query(reviewsRef, where("productId", "==", product.id));
        const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
            const reviews = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setReviews(reviews);

            // Calculate the average rating from the reviews
            const ratingsSum = reviews.reduce((sum, review) => sum + review.rating, 0);
            const newAverageRating = ratingsSum / reviews.length;
            setAverageRating(newAverageRating);
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, [product.id]);


    return (
        <AlertNotificationRoot >

            <ScrollView style={styles.scrollView}
                ref={(view) => {
                    this.scrollView = view;
                }}
            >

                <View style={styles.container}>

                    <View style={styles.productInfo}>
                        <View style={styles.productImageContainer}>
                        <TouchableOpacity onPress={() => router.navigate({ pathname: 'image', params:{imageUrl: encodeURIComponent(product.image?product.image:product.images[0])}})}>
                                {product.image ? (
                                    <Image style={styles.productImage} source={{ uri: product.image }} >
                                    </Image>) :
                                    (
                                        <Image style={styles.productImage} source={{ uri: product.images[0] }} >
                                        </Image>
                                    )}
                            </TouchableOpacity>
                            <View style={styles.additionalImagesContainer}>
                                
                            </View>

                        </View>

                        <View style={styles.productDetails}>
                            <View style={{ flexDirection: 'row', alignItems: "center" }}>
                                <Text style={styles.productName}>{product.name}</Text>
                                <TouchableOpacity style={{ backgroundColor: "#657786", padding: 5, borderRadius: 10, position: 'absolute', right: 0 }}
                                    onPress={() => addToFavorites(product)}>
                                    <Ionicons name='heart' color={'white'} size={25} >
                                    </Ionicons>
                                </TouchableOpacity>
                            </View>
                            {product.offer ? (
                                <Text style={styles.productPrice}>${product.offer} <Text style={styles.productPrice2}>{product.price}</Text></Text>

                            ) : (
                                <Text style={styles.productPrice}>${product.price}</Text>

                            )}
                            <Text style={styles.productDescription}>{product.disc}</Text>
                            {product.quantity == 2 ? (<Text style={styles.productPrice}>only two left in stock!</Text>) : (null)}
                            {product.quantity == 1 ? (<Text style={styles.productPrice}>only one left in stock!</Text>) : (null)}

                            <TouchableOpacity style={styles.addToCartButton} onPress={() => handleAddToCart(product) && handleScrollToEnd}>
                                <Text style={styles.addToCartButtonText}>Add to Cart</Text>
                            </TouchableOpacity>

                        </View>

                    </View>

                    {averageRating ? (
                        <View style={[styles.ratingContainer, { paddingBottom: 10, }]}>
                            {[...Array(Math.round(averageRating))].map((_, i) => (
                                <Text key={i}>
                                    <Ionicons name="star" size={30} color="#657786" />
                                </Text>
                            ))}
                        </View>
                    ) : <Text style={{fontFamily:'SunshineRegular',alignSelf:"center",padding:20,fontSize:20,color:'#657786'}}>No Rating</Text>}

                    <View style={styles.reviewSection}>

                        <Text style={styles.reviewTitle}>Reviews</Text>


                        <View style={styles.reviewList}>
                            {reviews.length === 0 ? (
                                <View>
                                    <Text style={styles.reviewListTitle}>no reviews yet</Text>
                                    <Text style={styles.noReviewsText}>be the first to review.</Text>
                                </View>
                            ) : (


                                <>
                                    <Text style={styles.reviewListTitle}>Recent Reviews</Text>

                                    {reviews.map((review, index) => (

                                        <View key={review.id} style={styles.reviewItem}>
                                           <TouchableOpacity onPress={() => router.navigate({ pathname: 'image', params:{imageUrl: encodeURIComponent(review.photoUrl)}})}>
                                                <Image
                                                    source={{ uri: review.photoUrl }}
                                                    style={styles.reviewAvatar}
                                                /></TouchableOpacity>
                                            <View style={{ flex: 3 }}>
                                                <View style={{ flexDirection: "row" }}>
                                                    <Text style={styles.reviewName}>{review.name}</Text>

                                                    {review.pass === user.email && (
                                                        <View style={{ flexDirection: "row" }}>
                                                            <TouchableOpacity
                                                                style={styles.reviewActionButton}
                                                                onPress={() => {
                                                                    setEditReviewId(review.id);
                                                                    setRating(review.rating);
                                                                    setReview(review.comment);
                                                                    this.scrollView.scrollToEnd({ animated: true });
                                                                }}
                                                            >
                                                                <Feather name="edit" size={20} color="#657786" style={{ marginRight: 5 }} />
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                style={styles.reviewActionButton}
                                                                onPress={() => {
                                                                    Alert.alert(
                                                                        "Delete review",
                                                                        "Are you sure you want to delete this review?",
                                                                        [
                                                                            {
                                                                                text: "Cancel",
                                                                                onPress: () => {
                                                                                    return;
                                                                                },
                                                                                style: "cancel",
                                                                            },
                                                                            {
                                                                                text: "Delete",
                                                                                onPress: () => handleDeleteReview(review.id),
                                                                            },
                                                                        ]
                                                                    );
                                                                }}
                                                            >
                                                                <Feather name="trash" size={20} color="#657786" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    )}
                                                </View>
                                                <View style={styles.reviewRating}>
                                                    {[...Array(review.rating)].map((_, i) => (
                                                        <Ionicons
                                                            key={i}
                                                            name="star"
                                                            size={20}
                                                            color="#657786"
                                                        />

                                                    ))}

                                                </View>
                                                <Text style={styles.reviewComment1}>{review.comment}</Text>
                                                <Text style={styles.reviewComment}>{review.edit} {new Date(review.createdAt).toLocaleString()}</Text>

                                            </View>
                                        </View>
                                    ))}
                                </>
                            )}

                        </View>
                        {editReviewId ? (

                            <View style={styles.reviewForm}>

                                <View style={styles.ratingContainer}>
                                    {[1, 2, 3, 4, 5].map((num) => (
                                        <TouchableOpacity
                                            key={num}
                                            style={[
                                                styles.ratingStar,
                                                rating >= num && styles.selectedRatingStar,
                                            ]}
                                            onPress={() => setRating(num)}
                                        >
                                            <Ionicons
                                                name="star"
                                                size={30}
                                                color={rating >= num ? "#657786" : "#E1E8ED"}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <TextInput
                                    style={styles.reviewInput}
                                    placeholder="Update your review"
                                    fontFamily="SunshineRegular"
                                    value={review}
                                    onChangeText={setReview}
                                    required={true}
                                />
                                <View style={{ flexDirection: "row", alignSelf: 'center' }}>
                                    <TouchableOpacity
                                        style={styles.cancelEditingButton}
                                        onPress={handleCancelEditing}
                                    >
                                        <Text style={styles.cancelEditingButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.submitReviewButton}
                                        onPress={() => handleEditReview(editReviewId)}
                                    >
                                        <Text style={styles.submitReviewButtonText}>Edit Review</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>) : (
                            <View style={styles.reviewForm}>
                                <View style={styles.ratingContainer}>
                                    <TouchableOpacity style={[styles.ratingStar, rating >= 1 && styles.selectedRatingStar]} onPress={() => setRating(1)}>
                                        <Ionicons name="star" size={30} color={rating >= 1 ? '#657786' : '#E1E8ED'} />
                                        {/*#F7D000 */}
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.ratingStar, rating >= 2 && styles.selectedRatingStar]} onPress={() => setRating(2)}>
                                        <Ionicons name="star" size={30} color={rating >= 2 ? '#657786' : '#E1E8ED'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.ratingStar, rating >= 3 && styles.selectedRatingStar]} onPress={() => setRating(3)}>
                                        <Ionicons name="star" size={30} color={rating >= 3 ? '#657786' : '#E1E8ED'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.ratingStar, rating >= 4 && styles.selectedRatingStar]} onPress={() => setRating(4)}>
                                        <Ionicons name="star" size={30} color={rating >= 4 ? '#657786' : '#E1E8ED'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.ratingStar, rating >= 5 && styles.selectedRatingStar]} onPress={() => setRating(5)}>
                                        <Ionicons name="star" size={30} color={rating >= 5 ? '#657786' : '#E1E8ED'} />
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={styles.reviewInput}
                                    placeholder="Write a review"
                                    fontFamily="SunshineRegular"
                                    value={review}
                                    onChangeText={setReview}
                                    required={true}
                                />

                                <TouchableOpacity style={styles.submitReviewButton} onPress={handleReview}>
                                    <Text style={styles.submitReviewButtonText}>Submit Review</Text>
                                </TouchableOpacity>
                            </View>)}
                    </View>



                </View>

            </ScrollView>
            <TouchableOpacity style={styles.cartIconContainer} onPress={() => router.push('Cart')} >
                <Feather name="shopping-cart" size={30} color="#fff" />
                {cartTotal > 0 && (
                    <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{cartTotal}</Text>
                    </View>
                )}
            </TouchableOpacity>

        </AlertNotificationRoot >
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F5F8FA',
    }, scrollView: {
        flex: 1,
        backgroundColor: '#F5F8FA',

    },
    additionalImagesContainer: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent:'center'
    },
    additionalImageContainer: {
        width: '50%',
        aspectRatio: 1,
        alignItems: 'center',
        alignSelf: 'center',
    },
    additionalImage: {
        width: '150%',
        height: '150%',
        borderRadius:10,
        resizeMode: 'cover',
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
        color: "#657786",

        fontSize: 16,
        textAlign: "center",
        marginTop: 10,
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
    cancelEditingButton: {
        backgroundColor: "#B9C6D0",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 8,
    },
    cancelEditingButtonText: {
        fontFamily: "SunshineRegular",
        fontSize: 20,
        fontWeight: "500",
        color: '#657786'
    },
    selectedRatingStar: {
        color: '#657786'
    },
    productInfo: {
        flexDirection: 'row',
    },
    productImageContainer: {
        width: '44%',
        height: 215,
        marginRight: 20,
        borderRadius: 10,
    },
    productImageText: {
        fontSize: 20,
        fontFamily: 'SunshineRegular',
        color: '#657786',
    },
    productDetails: {
        fontFamily: 'SunshineRegular',
        padding: 10,
    },
    productImage: {
        width: '100%',
        height: 200,
        resizeMode: 'contain',
        marginRight: 20,
    },
    productDetails: {
        flex: 1,
    },
    productName: {
        fontSize: 24,
        fontFamily: 'SunshineRegular',
        marginBottom: 10,
        color: '#657786', //#657800

    },
    productPrice: {
        fontSize: 20,
        fontFamily: 'SunshineRegular',
        marginBottom: 10,
        color: "#1DA1F2"

    },
    productPrice2: {
        fontSize: 14,
        fontFamily: 'SunshineRegular',
        color: '#657786', //#657800
        textDecorationLine: 'line-through', // add this line to cross out the text

    },

    productDescription: {
        fontSize: 16,
        marginBottom: 10,
        color: '#657786', //#657800
        fontFamily: 'SunshineRegular',

    },
    addToCartButton: {
        backgroundColor: '#657786',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginTop: 10
    },
    addToCartButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        textAlign: 'center',
        fontFamily: 'SunshineRegular',

    },
    addToCartButton2: {
        backgroundColor: '#657786',
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignSelf: 'center',
        borderRadius: 10,
        marginTop: 6,
        paddingBottom: 10,
    },
    addToCartButtonText2: {
        color: '#FFFFFF',
        fontSize: 12,
        textAlign: 'center',
        fontFamily: 'SunshineRegular',

    },
    reviewSection: {
        top: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 20,
    },
    reviewTitle: {
        fontSize: 24,
        fontFamily: 'SunshineRegular',
        marginBottom: 10,
        color: '#657786', //#657800

    },
    reviewForm: {
        marginBottom: 20,
    },
    reviewInput: {
        backgroundColor: '#F5F8FA',
        color: '#657786',
        fontFamily: 'SunshineRegular',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    ratingContainer: {
        alignSelf: 'center',
        flexDirection: 'row',
        marginBottom: 10,
    },
    ratingStar: {
        padding: 4,
    },

    submitReviewButton: {
        backgroundColor: '#657786',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    submitReviewButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        textAlign: 'center',
        fontFamily: "SunshineRegular"

    },
    reviewList: {
        borderTopWidth: 1,
        borderTopColor: '#657786',
        paddingTop: 20,
    },
    reviewListTitle: {
        fontSize: 20,
        fontFamily: 'SunshineRegular',
        marginBottom: 10,
        color: '#657786', //#657800
        borderBottomWidth: 0.1,
        borderColor: '#657786'
    },
    reviewItem: {
        flexDirection: 'row', // Add flexDirection property
        alignItems: 'flex-start', // Align items to the top of the row
        marginBottom: 10,
        borderBottomWidth: 0.4,
        borderColor: '#657786',
    },
    reviewAvatar: {
        width: 50, // Increase image width for more spacing
        height: 50, // Increase image height for more spacing
        borderRadius: 25,
        marginRight: 10,
    },
    reviewName: {
        fontFamily: 'SunshineRegular',
        fontSize: 16,
        marginBottom: 5,
        flex: 2, // Take 2/4 of row width
    },
    reviewRating: {
        flexDirection: 'row',
        marginBottom: 5,
        flex: 1, // Take 1/4 of row width
        alignItems: 'center', // Align items to the center
    },
    reviewComment: {
        fontFamily: 'SunshineRegular',
        fontSize: 14,
        paddingBottom: 10,

        textAlign: 'right',
    },
    reviewComment1: {
        fontFamily: 'SunshineRegular',
        fontSize: 16,
        paddingBottom: 10,
        flex: 4, // Take 4/4 of row width
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        marginTop: 20,
    },
    button: {
        backgroundColor: '#000',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        textAlign: 'center',
    },
});
const overrides = {
    titleStyle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#657786',
        textAlign: 'center',
        marginBottom: 10,
    },
    messageStyle: {
        fontSize: 16,
        color: '#657786',
        textAlign: 'center',
        marginTop: 20,
    },
    buttonStyle: {
        backgroundColor: '#657786',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    buttonTextStyle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
};

// Apply the overrides to the Alert component
Object.assign(Alert.alert, overrides);
export default ProductPage;